var environment    = ((process.env.NODE_ENV == undefined) || (process.env.NODE_ENV == 'REPL')) ?
                            'development' : process.env.NODE_ENV;
var databaseConfig = require('./../../../config/database_config.js')[environment];
var _              = require('lodash')
var r              = require('rethinkdb');
var async          = require('async');
var constants      = require('./../../../config/constants.js');
var tableName      = constants.eventsTableName;
var eventSeqTable  = constants.eventSeqTableName
var Logger         = require('./../../../config/logger.js');
var Fiber          = require('fibers');
var Future         = require('fibers/future')
var wait           = Future.wait
var Conn           = null;

var proxyServerConfig = _.findLast(databaseConfig.servers, function(server){
    if(server.proxy == true)
        return server;
});

var databaseConnectionOptions = {
    host: proxyServerConfig.host,
    port: proxyServerConfig.port,
    db: databaseConfig.databaseName
};

var _createConnection = function(cb){
    if((Conn && Conn.open))
        cb(Conn)
    else
        exec(function(conn){
            Conn = conn;
            cb(Conn);
        })
}

var exec = function(connectionSuccessCb){
    if(Conn && Conn.open)
        connectionSuccessCb(Conn)
    else
        r.connect(databaseConnectionOptions, function(err, conn){
            if(err)
                handleConnectionFailure(err, connectionSuccessCb);
            else {
                Conn = conn;
                connectionSuccessCb(conn);
            }
        })
};

var handleConnectionFailure = function(err, connectionSuccessCb){
    console.log('Could not connect to database');
    if(err) {
        console.log(err);
        process.exit(1);
    }
};

/**
 *  Set up database and table information for the events table
 *  1. Creates a database defined in the config file
 *  2. Creates an events table with an id as primary key
 *  3. Triggers events_sequences table generation code.
 */
var setup = function(callback){
    exec(function(conn){
        async.waterfall([
            function checkDatabaseExists(cb){
                r.dbList().run(conn, cb)
            },
            function createDb(databases, cb){
                if(_.includes(databases, databaseConnectionOptions.db))
                    cb(null, true);
                else
                    r.dbCreate(databaseConnectionOptions.db).run(conn, cb)
            },
            function checkTableExists(dbCreateStatus, cb){
                r.db(databaseConnectionOptions.db).tableList().run(conn, cb);
            },
            function createTable(tables, cb){
                if(_.includes(tables, 'events'))
                    cb(null, true)
                else {
                    r.db(databaseConnectionOptions.db).tableCreate(tableName, {
                        primaryKey: 'id',
                        durability: 'soft',
                        replicas: databaseConfig.replicaCount,

                    }).run(conn, cb)
                }
            },
            function indexExists(tableCreateStatus, cb){
                r.db(databaseConnectionOptions.db)
                 .table(tableName)
                 .indexList()
                 .run(conn, cb);
            },

            function createIndex(indexes, cb){
                if(!(_.includes(indexes, constants.eventsAttributeStream)))
                    r.db(databaseConnectionOptions.db)
                     .table(tableName)
                     .indexCreate(constants.eventsAttributeStream)
                     .run(conn, cb);
                else
                    cb(null, true);
            }
        ], function done(err, indexCreateStatus){
            if(err)
                throw err;
            else {
                conn.close();
                Logger.info(['info'], 'Setup successful. RethinkDb initialized.');
                setupSequenceGenerator(callback);
            }
        })
    })

};


var setupSequenceGenerator = function(callback){
    exec(function(conn){
        async.waterfall([
                function sequenceGeneratorTableExists(callback){
                    r.db(databaseConnectionOptions.db).tableList().run(conn, callback);
                },
                function createSequenceGenerator(tables, cb){
                    if(_.includes(tables, eventSeqTable))
                        cb(null, true);
                    else
                        r.db(databaseConnectionOptions.db).tableCreate(eventSeqTable, {
                            primaryKey: 'id',
                            durability: 'hard',
                            replicas: databaseConfig.replicaCount
                        }).run(conn, cb);
                },
                function SeqDocumentExists(tablesCreatedStatus, cb){
                    if(tablesCreatedStatus)
                        var count = r.table(eventSeqTable).count().run(conn,cb)
                    else
                        throw new Error('Table could not be created');
                },
                function createSeqDocument(documentCount, cb){
                    if(documentCount == 0) {
                        var insertStatus = r.table(eventSeqTable).insert({
                            seq: 1,
                            id: 'counter'
                        }, { durability: 'soft', returnChanges: true, conflict: 'error'}).run(conn, cb);

                    }else
                        cb(null, true);
                }
            ],
            function(err, sequenceGeneratorCreateStatus){
                conn.close();
                if(err)
                    console.log(err);
                else {
                    Logger.info(['init.js', 'info'], 'Sequence Generator created.');
                    _createConnection(callback)
                }
            }
        );
    })
};

var nextSeq = function(cb){
    exec(function(conn){
        r.db(databaseConnectionOptions.db)
          .table(eventSeqTable)
          .get('counter')
          .update({seq: r.row('seq').add(1)}, {nonAtomic: false, returnChanges: true}
        ).run(conn, function(err, nextSequence){
            if(err)
                cb(err, null)
            else
                cb(null, nextSequence.changes[0].new_val.seq);
        });
    });
}

var nextSeqF = function(conn){
    var fiber = Fiber.current;

    r.db(databaseConnectionOptions.db)
        .table(eventSeqTable)
        .get('counter')
        .update({seq: r.row('seq').add(1)}, {nonAtomic: false, returnChanges: true}
    ).run(conn, function(err, nextSequence){
        if(err)
            throw err;
        else
            fiber.run(nextSequence.changes[0].new_val.seq);

    });

    var nextSequence = Fiber.yield()
    return nextSequence;
}

var connectF = function(){
    var fiber = Fiber.current;

    r.connect(databaseConnectionOptions, function(err, conn){
        if(err)
            throw err;
        else {
            fiber.run(conn);
        }
    })

    var connection = Fiber.yield();
    return connection;
}

var uuid = function(cb){
    exec(function(conn){
        r.uuid().run(conn, function(err, uuid){
            if(err)
                cb(err, null);
            else
                cb(null, uuid);
        });
    })
}

var uuidF = function(conn){
    var fiber = Fiber.current;
    var conn = connectF();
    r.uuid().run(conn, function(err, uuid){
        if(err)
            throw err;
        else
            fiber.run(uuid);
    })

    var uid = Fiber.yield();
    return uid;
}

//var _uuidF = function(){
//    var future = new Future;
//    Fiber(function(){
//        var uuid = uuidF()
//        future.return(uuid);
//    }).run();
//
//    return future;
//}

var db = {
    r: r,
    setup: setup,
    exec: exec,
    nextSeq: nextSeq,
    uuid: uuid,
    connectF: connectF,
    nextSeqF: nextSeqF,
    uuidF: uuidF,
    databaseName: databaseConnectionOptions.db,
    eventsTableName: tableName,
    Connection: _createConnection
};

// Setup database;
//db.setup();


module.exports = db;




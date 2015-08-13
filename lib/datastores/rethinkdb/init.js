var environment    = ((process.env.NODE_ENV == undefined) || (process.env.NODE_ENV == 'REPL')) ?
                            'development' : process.env.NODE_ENV;
var databaseConfig = require('./../../../config/database_config.js')[environment];
var _              = require('lodash')
var r              = require('rethinkdb');
var async          = require('async');
var constants      = require('./../../../config/constants.js');
var tableName      = constants.eventsTableName;
var eventSeqTable  = constants.eventSeqTableName;
var accountsTable  = constants.accountsTableName;
var streamsTable   = constants.streamsTableName;
var Logger         = require('./../../../config/logger.js');
var Fiber          = require('fibers');
var Future         = require('fibers/future')
var wait           = Future.wait
var Conn           = null;
var util           = require('util');

var proxyServerConfig = _.findLast(databaseConfig.servers, function(server){
    if(server.proxy == true)
        return server;
});

var databaseConnectionOptions = {
    host: proxyServerConfig.host,
    port: proxyServerConfig.port,
    db: databaseConfig.databaseName
};

var _newConnection = function(cb){
    exec(function(conn){
        cb(conn);
    })
}

var _createConnection = function(cb){
    console.log('Create connection called', util.inspect(cb));
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
                console.log('Databases in createDb', util.inspect(databases));

                if(_.includes(databases, databaseConnectionOptions.db))
                    cb(null, true);
                else {
                    r.dbCreate(databaseConnectionOptions.db).run(conn, cb)
                }
            },
            function checkAccountsTableExists(dbCreateStatus, cb){
                console.log("checkAccountsTableExists dbCreateStatus", util.inspect(dbCreateStatus));

                conn.use(databaseConnectionOptions.db);
                r.db(databaseConnectionOptions.db).tableList().run(conn, cb);
            },

            function createAccountsTable(tables, cb){
                console.log('createAccountsTable tables', util.inspect(tables));

                if(_.includes(tables, accountsTable))
                    cb(null, true);
                else{
                    r.tableCreate(accountsTable, {
                        primaryKey: 'email',
                        durability: 'hard',
                        replicas: databaseConfig.replicaCount
                    }).run(conn, cb);
                }
            },

            function createIndexOnIdAndAccountToken(accountTablesCreatedStatus, cb){

                var onAccountTokenIndexCreated = function(err, accountTokenIndexCreated){

                    if(err)
                        cb(err, accountTokenIndexCreated);
                    else
                        createIdIndex();
                }

                var onIdIndexCreated = function(err, idIndexCreated){

                    if(err)
                        cb(err, idIndexCreated)
                    else
                        cb(null, true);
                }


                var createIdIndex = function(){

                    r.table(accountsTable).indexList().run(conn, function(err, indexes){
                        console.log("Indexes", util.inspect(indexes));
                        if(!(_.contains(indexes, 'id'))){
                            r.table(accountsTable)
                                .indexCreate('id')
                                .run(conn, onIdIndexCreated);
                        }else{
                            onIdIndexCreated(null, true);
                        }
                    })
                }

                var createAccountTokenIndex = function() {
                    r.table(accountsTable).indexList().run(conn, function(err, indexes){
                        console.log("Indexes", util.inspect(indexes));
                        if(!(_.contains(indexes, 'accountToken'))) {
                            r.table(accountsTable)
                                .indexCreate('accountToken')
                                .run(conn, onAccountTokenIndexCreated)
                        }else{
                            onAccountTokenIndexCreated(null, true)
                        }
                    })
                };
                createAccountTokenIndex();
            }
        ], function done(err, indexesCreated){
            console.log('Final callback on Setup', util.inspect(indexesCreated));

            if(err)
                throw err;
            else {
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
                function createSequenceGenerator(tables, cb) {
                    console.log('createSequenceGenerator tables', util.inspect(tables));

                    if (_.includes(tables, eventSeqTable))
                        cb(null, true);
                    else
                        r.db(databaseConnectionOptions.db).tableCreate(eventSeqTable, {
                            primaryKey: 'table_name',
                            durability: 'hard',
                            replicas: databaseConfig.replicaCount
                        }).run(conn, cb);
                }
            ],
            function(err, sequenceGeneratorCreateStatus){
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
    Connection: _createConnection,
    databaseConfig: databaseConfig,
    newConnection: _newConnection
};

// Setup database;
//db.setup();


module.exports = db;




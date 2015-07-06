var environment    = process.env.NODE_ENV == undefined ? 'development' : process.env.NODE_ENV;
var databaseConfig = require('./database_config.js')[environment];
var _              = require('lodash')
var r              = require('rethinkdb');
var async          = require('async');
var tableName      = 'events';
var eventSeqTable  = 'event_sequences'
var Logger         = require('./logger.js');

var proxyServerConfig = _.findLast(databaseConfig.servers, function(server){
    if(server.proxy == true)
        return server;
});

var databaseConnectionOptions = {
    host: proxyServerConfig.host,
    port: proxyServerConfig.port,
    db: databaseConfig.databaseName
};

var exec = function(connectionSuccessCb){
    r.connect(databaseConnectionOptions, function(err, conn){
        if(err)
            handleConnectionFailure(err);
        else
            connectionSuccessCb(conn);
    })
};

var handleConnectionFailure = function(err){
    throw err;
};

var setup = function(){
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
                        replicas: 2,

                    }).run(conn, cb)
                }
            }
        ], function done(err, tableCreateStatus){
            if(err)
                throw err;
            else {
                conn.close();
                Logger.info(['info'], 'Setup successful. RethinkDb initialized.');
                setupSequenceGenerator();
            }
        })
    })

};

var setupSequenceGenerator = function(){
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
                            replicas: 2
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
                if(err)
                    console.log(err);
                else
                    Logger.info(['database.js', 'info'], 'Sequence Generator created.');
            }
        );
    })
};

var nextSeq = function(cb){
    exec(function(conn){
        r.db(databaseConnectionOptions.db)
          .get('counter')
          .update({seq: r.row('seq').add(1)}, {nonAtomic: false, returnChanges: true}
        ).run(conn, cb);
    });
}

var db = {
    r: r,
    setup: setup,
    exec: exec,
    nextSeq: nextSeq
};

// Setup database;
db.setup();

module.exports = db;




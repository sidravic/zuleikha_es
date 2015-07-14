var db = require('./../lib/datastores/rethinkdb/init.js');
var constants = require('./../config/constants.js');
var eventSeqTableName = constants.eventSeqTableName;
var r = db.r;
var async = require('async');
var exec = db.exec;

var createSeqGen = function(tableName, callback){
    exec(function(conn){
        async.waterfall([
            function checkSequenceTableExists(cb){
                conn.use(db.databaseName);

                r.table(eventSeqTableName)
                    .filter({table_name: tableName})
                    .run(conn, function(err, cursor){
                        if(err)
                            cb(err, null);
                        else
                            cursor.toArray(function(err, result){
                                if(err)
                                    cb(err, null);
                                else
                                    cb(null, result);
                            })
                    });
            },

            function createSeqTable(tableExistsResult, cb){
                debugger;
                console.log('Table exists');
                console.log(tableExistsResult);
                if((tableExistsResult instanceof Array) && (tableExistsResult.length == 0))
                    r.table(eventSeqTableName).insert({
                        table_name: tableName,
                        sequence_number: 0,
                        _createdAt: new Date(),
                        _updatedAt: null
                    }, {durability: 'hard',
                        returnChanges: true,
                        conflict: 'error'
                        }).run(conn, cb);
            }
        ], function(err, result){
            if(err)
                callback(err, null)
            else
                callback(null, result);
        })
    });
}

var SequenceGeneratorService = {
    create: function(tableName, cb){
        createSeqGen(tableName, function(err, seqGenCreatedStatus){
            cb(err, seqGenCreatedStatus);
        })
    }
}


module.exports = SequenceGeneratorService;
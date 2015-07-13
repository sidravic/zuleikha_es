var db = require('./../lib/datastores/rethinkdb/init.js');
var constants = require('./../config/constants.js');
var eventSeqTableName = constants.eventSeqTableName;
var r = db.r;
var async = require('async');

var createSeqGen = function(tableName, callback){
    exec(function(conn){
        async.waterfall([
            function checkSequenceTableExists(tableName, cb){
                r.table(eventSeqTableName).get(tableName).
                run(conn, cb)
            },

            function createSeqTable(tableExistsResult, cb){
                if(!tableExistsResult)
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
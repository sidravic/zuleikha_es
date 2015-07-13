var db = require('./../lib/datastores/rethinkdb/init.js');
var r  = db.r;
var exec = db.exec;
var databaseConfig = db.databaseConfig;
var constants = require('./../config/constants.js');
var sequenceGeneratorService = require('./event_stream_sequence_create_service.js');
var async = require('async');
var _ = require('lodash');
var server = require('./../app.js');

var internals = {};
internals.eventStreamAndSequenceGenInitialized = false;

var server = require('./../app.js');
server.app.eventStreamAndSequenceGenInitialized = internals.eventStreamAndSequenceGenInitialized


var createStream = function(tableName, callback){
    exec(function(conn){
        async.waterfall([
            function checkIfTableExists(cb){
                r.tableList().run(conn, cb)
            },

            function createStreamTable(tables, cb){
                if(_.includes(tables, tableName))
                    cb(null, true)
                else
                    r.tableCreate(tableName, {
                        primaryKey: 'sequence_id',
                        replicas: databaseConfig.replicaCount,
                        durability: 'hard'
                    }).db(conn, cb);
            }
        ], function(err, result){
            if(err)
                callback(err, null);
            else
                callback(null, result);
        })
    })
};

var getTableName = function(accountId, streamName){
    return accountId + "_" + streamName;
}

var EventStreamService = {
    /**
     *  Called when the application is loaded the first time
     *  Initialize method will setup the tables, primary keys and
     *  indexes
     *
     *  table_name: event_streams
     *  primary_key: stream_name
     *  foreign_key: account_id
     */
    create: function(accountId, streamName, cb){
        var tableName = getTableName(accountId, streamName);

        var onStreamTableCreateFinished = function(err, tableCreateStatus) {
            if(err)
                cb(err, null);
            else
                sequenceGeneratorService.create(tableName,
                    onSequenceGeneratorCreateFinished);
        };

        var onSequenceGeneratorCreateFinished = function(err, seqGenCreateStatus){
            if(!err) {
                internals.eventStreamAndSequenceGenInitialized = true;
            }
        };

        createStream(tableName, onStreamTableCreateFinished);
    }
}


module.exports = EventStreamService;
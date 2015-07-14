var db = require('./../lib/datastores/rethinkdb/init.js');
var r  = db.r;
var exec = db.exec;
var databaseConfig = db.databaseConfig;
var constants = require('./../config/constants.js');
var sequenceGeneratorService = require('./event_stream_sequence_create_service.js');
var async = require('async');
var _ = require('lodash');
var server = require('./../app.js');
var nameGeneratorService = require('./name_generator_service.js')
var util   = require('util');

var internals = {};
internals.eventStreamAndSequenceGenInitialized = false;

var server = require('./../app.js');
server.app.eventStreamAndSequenceGenInitialized = internals.eventStreamAndSequenceGenInitialized


var createStream = function(tableName, accountId, streamName, callback){
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
                    }).run(conn, cb);
            }
        ], function(err, result){
            if(err) {
                console.log('[ERROR] ' + util.inspect(err));
                callback(err, null, accountId, streamName);
            }
            else {
                console.log('Stream Create ' + util.inspect(result));
                callback(null, result, accountId, streamName);
            }
        })
    })
};

var EventStreamService = {
    /**
     *  Called when the application is loaded the first time
     *  Initialize method will setup the tables, primary keys and
     *  indexes
     *
     *  table_name: event_streams
     *  primary_key: stream_name
     *  foreign_key: account_id
     **/
    create: function(accountId, streamName, cb){
        var tableName = nameGeneratorService.getTableName(accountId, streamName);

        var onStreamTableCreateFinished = function(err, tableCreateStatus,
                                                   accountId, streamName) {
            if(err)
                cb(err, null);
            else
                sequenceGeneratorService.create(tableName, accountId,
                                                streamName,
                                                onSequenceGeneratorCreateFinished);
        };

        var onSequenceGeneratorCreateFinished = function(err, seqGenCreateStatus, accountId, streamName){
            if(!err) {
                internals.eventStreamAndSequenceGenInitialized = true;
                cb(null, seqGenCreateStatus, accountId, streamName)
            }else
                cb(err, null, accountId, streamName);
        };

        createStream(tableName, accountId, streamName, onStreamTableCreateFinished);
    }
}


module.exports = EventStreamService;
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
var Logger = require('./../config/logger.js');
var accountsService = require('./../lib/web/accounts/services/account_services.js');


var internals = {};
internals.eventStreamAndSequenceGenInitialized = false;
var server = require('./../app.js');

var createStream = function(tableName, accountId, streamName, callback){
    exec(function(conn){
        async.waterfall([
            function checkIfTableExists(cb){
                r.tableList().run(conn, cb)
            },

            function createStreamTable(tables, cb){
                if(_.includes(tables, tableName)) {
                    Logger.info(['event_stream_create_service.js'], 'Table Exists ' + util.inspect(tableName));
                    cb(null, true)                }
                else
                    r.tableCreate(tableName, {
                        primaryKey: 'sequence_id',
                        replicas: databaseConfig.replicaCount,
                        durability: 'hard'
                    }).run(conn, cb);
            }
        ], function(err, result){
            if(err) {
                Logger.error(['event_stream_create_service.js'], '[ERROR] ' + util.inspect(err));
                callback(err, result, accountId, streamName);
            }
            else {
                Logger.info(['event_stream_create_service.js'], 'Stream Create ' + util.inspect(result));
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
        debugger;
        var tableName = nameGeneratorService.getTableName(accountId, streamName);
        Logger.info(['event_stream_create_service.js'], '[Create Stream] AccountId: ' +
                                                        accountId + " StreamName: " + streamName);

        var onStreamTableCreateFinished = function(err, event, accountId, streamName) {
            Logger.info(['event_stream_create_service.js'], '[Create Stream Finished] AccountId: ' +
                                                              accountId + " StreamName: " + streamName);

            if(err)
                cb(err, false, accountId, streamName, event);
            else {
                sequenceGeneratorService.create(tableName, accountId,
                                                streamName, event,
                                                onSequenceGeneratorCreateFinished);
            }
        };

        var onSequenceGeneratorCreateFinished = function(err, event, seqGenCreateStatus, accountId, streamName){
            Logger.info(['event_stream_create_service.js'], '[Create Stream Sequence Generation Table Create Finished] AccountId: ' +
                accountId + " StreamName: " + streamName);
            if(!err) {
                internals.eventStreamAndSequenceGenInitialized = true;

                var onAddStream = function(err, result){
                    if(err){
                        cb(err, null, accountId, streamName, event)
                    }else{
                        cb(null, result, accountId, streamName, event);
                    }
                };
                debugger;
                accountsService.addStream(accountId, streamName, onAddStream);
            }else {
                cb(err, null, accountId, streamName, event);
            }
        };

        createStream(tableName, accountId, streamName, onStreamTableCreateFinished);
    }
}


module.exports = EventStreamService;
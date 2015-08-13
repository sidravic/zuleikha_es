var constants = require('./../../../../config/constants.js');
var db        = require('./../../../datastores/rethinkdb/init.js');
var r         = db.r;
var dbName    = db.databaseName;
var accountsTable = constants.accountsTableName;
var exec      = db.exec;
var eventStreamCreateService = require('./../../../../services/event_stream_create_service.js');
var async     = require('async')
var Logger    = require('./../config/logger.js');

var AccountsService = {
    getCurrentAccount: function(accountId, cb){
        exec(function(conn){
            r.table(accountsTable)
                .getAll(accountId, {index: 'id'})
                .run(conn, function(err, cursor){
                    debugger;
                    if(err){
                        cb(err, null);
                    }else{
                        cursor.toArray(function(err, accounts){
                            if(err)
                                cb(err, null);
                            else{
                                var account = accounts[0];
                                cb(null, account);
                            }
                        })
                    }
                })
        })

    },

    addToStream: function(accountId, streamName, cb) {
        debugger;
        var onStreamCreated = function(err, createStatus, accountId, streamName, event){
            if(err){
                Logger.error(['api', 'accounts_service.js'], err.message + "\n " + err.stack);
                cb(err, null, streamName);
            }else{
                debugger;
                cb(null, createStatus, streamName);
            }
        }
        eventStreamCreateService.create(accountId, streamName, onStreamCreated)
    }
};

module.exports = AccountsService;
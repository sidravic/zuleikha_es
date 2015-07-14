var db                   = require('./../lib/datastores/rethinkdb/init.js');
var exec                 = db.exec;
var nextSeq              = require('./../models/sequence_generator.js').nextSeq;
var nameGeneratorService = require('./name_generator_service.js');
var async   = require('async');
var Event   = require('./../models/event.js');
var _       = require('lodash');

var EventsService = {
    buildEvent: function(accountId, eventStreamName,
                         eventAttributes, callback){
        var tableName = nameGeneratorService.getTableName(accountId,
                                                         eventStreamName);
        async.series({
            populateSeqNumber: function(cb){
                nextSeq(tableName, cb);
            },

            populateEvent: function(cb){
                var event = new Event();

                event.accountId = accountId;
                event.stream = eventStreamName;
                _.each(eventAttributes, function(value, key){
                   event[key] = value;
                });

                cb(null, event);
            }
        }, function completeBuildEvent(err, result){
            if(err) {
                callback(err, null);
            }
            else {
                var event = result.populateEvent;
                event.sequence_id = result.populateSeqNumber;
                callback(null, event);
            }
        })
    }
};

module.exports = EventsService;
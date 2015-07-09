var db   = require('./../lib/datastores/rethinkdb/init.js');
var exec = db.exec;
var nextSeq = db.nextSeq;
var uuid    = db.uuid;
var async   = require('async');
var Event   = require('./../models/event.js');
var _       = require('lodash');

var EventsService = {
    buildEvent: function(eventStreamName, eventAttributes, callback){
        debugger;
        async.series({
            populateSeqNumber: function(cb){
                nextSeq(function(err, nextSeq){
                    cb(err, nextSeq)
                })
            },

            populateEvent: function(cb){
                var event = new Event();

                event.stream = eventStreamName;
                _.each(eventAttributes, function(value, key){
                   event[key] = value;
                });

                cb(null, event);
            }
        }, function completeBuildEvent(err, result){
            if(err) {
                console.log(err);
                callback(err, null);
            }
            else {
                console.log(result);
                var event = result.populateEvent;
                event.seqId = result.populateSeqNumber;
                callback(null, event);
            }
        })
    }
};

module.exports = EventsService;
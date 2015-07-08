var db = require('./init.js');
var connectF = db.connectF;
var Event    = require('./../../../models/event.js');
var Fiber    = require('fibers');
var _        = require('lodash');
var dbName   = db.databaseName;
var r        = db.r;
var eventsTableName = db.eventsTableName
var Future   = require('fibers/future');
var await    = Future.await;
var serviceBus = require('./../../../config/servicebus.js');
var util       = require('util')

var publishEvent = function(stream, event){
    var streamName = "notify." + stream;
    console.log('Publishing Event', event);
    serviceBus.publish(streamName, util.inspect(event));
}

var Changes = {
    subscribe: function(stream, writeableStream){
        var self = this;

        db.exec(function(conn){
            r.db(dbName)
                .table(eventsTableName)
                .changes({squash: false})
                .run(conn, function(err, cursor){
                    cursor.each(function publishNextEvent(err, event){
                        if(event.stream == stream)
                            publishEvent(stream, event.new_val);
                    }, self.onFinished)
                })
        })
    }
}

module.exports = Changes;


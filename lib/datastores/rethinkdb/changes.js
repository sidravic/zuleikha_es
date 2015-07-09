var db = require('./init.js');
var dbName   = db.databaseName;
var r        = db.r;
var eventsTableName = db.eventsTableName
var Future   = require('fibers/future');
var serviceBus = require('./../../../config/servicebus.js');
var util       = require('util')

var publishEvent = function(stream, event){
    var streamName = "notify." + stream;
    serviceBus.publish(streamName, event);
}

var Changes = {
    subscribe: function(stream){
        var self = this;

        db.exec(function(conn){
            r.db(dbName)
                .table(eventsTableName)
                .changes({squash: false})
                .run(conn, function(err, cursor){
                    console.log(err);
                    cursor.each(function publishNextEvent(err, event){

                        if(event.stream == stream)
                            publishEvent(stream, event.new_val);
                    }, self.onFinished)
                })
        })
    }
}

module.exports = Changes;


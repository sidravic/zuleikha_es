var db       = require('./init.js');
var nextSeqF = db.nextSeqF;
var connectF = db.connectF;
var Event    = require('./../../../models/event.js');
var Fiber    = require('fibers');
var _        = require('lodash');
var dbName   = db.databaseName;
var r        = db.r;
var eventsTableName = db.eventsTableName
var Future   = require('fibers/future');
var await    = Future.await;
var exec     = db.exec
var eventServices = require('./../../../services/events_service.js');
var Event    = require('./../../../models/event.js');


var Persistence = {
    save: function(stream, eventAttributes, cb){
          var onSaveCompleted = function(err, insertedChanges){
                if(err)
                    cb(err, null)
                else
                    cb(null, insertedChanges.changes[0].new_val);
          }
          debugger;

          eventServices.buildEvent(stream, eventAttributes, function(err, event){
              console.log(event);
              exec(function(conn){
                  console.log('Event Save started COnnection Open' + conn.open);
                  r.db(dbName)
                      .table(eventsTableName)
                      .insert(event, { conflict: 'error',
                          returnChanges: true,
                          durability: 'hard'
                      })
                      .run(conn, function(err, insertedChanges){
                          onSaveCompleted(err, insertedChanges);
                      })
              })
          })
    },

    //_saveF: function(conn, event){
    //    var fiber = Fiber.current;
    //
    //    if (!conn)
    //        conn = connectF();
    //
    //    r.db(dbName)
    //     .table(eventsTableName)
    //     .insert(event, {conflict: 'error',
    //                     returnChanges: true,
    //                     durability: 'hard'
    //                    })
    //     .run(conn, function(err, insertChanges){
    //        if(err)
    //            throw err;
    //        else
    //            fiber.run(insertChanges);
    //     })
    //
    //
    //    var insertedEvent = Fiber.yield();
    //    return insertedEvent;
    //},

    //saveF: function(stream, eventAttributes, cb){
    //    var future = new Future;
    //    var self = this;
    //
    //    Fiber(function(){
    //        var conn = connectF();
    //        var seqId = nextSeqF(conn);
    //        var streamName = stream;
    //
    //        var event = new Event();
    //        event.seqId = seqId;
    //        event.stream = streamName;
    //
    //        _.each(eventAttributes, function(value, key){
    //            event[key] = value;
    //        })
    //
    //        try {
    //            var insertedEvent = self._save(conn, event);
    //            future.return(insertedEvent);
    //        }catch(err){
    //            console.log(err);
    //            throw err;
    //        }
    //    }).run();
    //
    //    return future;
    //}
}

module.exports = Persistence;
var db       = require('./init.js');
var nextSeqF = db.nextSeqF;
var connectF = db.connectF;
var Event    = require('./../../../models/event.js');
var Fiber    = require('fibers');
var _        = require('lodash');
var dbName   = db.databaseName;
var r        = db.r;
var Future   = require('fibers/future');
var await    = Future.await;
var exec     = db.exec
var eventServices = require('./../../../services/event_builder_service.js');
var Event    = require('./../../../models/event.js');


var Persistence = {
    save: function(event, tableName, cb){
          var onSaveCompleted = function(err, insertedChanges){
                debugger;
                if(err)
                    cb(err, null)
                else
                    cb(null, insertedChanges.changes[0].new_val);
          }

          console.log(event);
          exec(function(conn){
              console.log('Event Save started COnnection Open' + conn.open);
              r.db(dbName)
                  .table(tableName)
                  .insert(event, { conflict: 'error',
                      returnChanges: true,
                      durability: 'hard',
                  })
                  .run(conn, function(err, insertedChanges){
                      onSaveCompleted(err, insertedChanges);
                  })
          })

    }
}

module.exports = Persistence;
var db                     = require('./../lib/datastores/rethinkdb/init.js');;
var dbName                 = db.databaseName;
var r                      = db.r;
var eventsTableName        = db.eventsTableName
var serviceBus             = require('./../config/servicebus.js');
var util                   = require('util')
var nameGeneratorService   = require('./name_generator_service.js');
var events                 = require('events');
var constants              = require('./../config/constants.js');
var eventEmitter           = new events.EventEmitter();

var publishEvent = function(queueName, event){
    console.log('_____________________________________________')
    console.log('Publishing to ' + queueName);
    serviceBus.publish(queueName, event);
    console.log('_____________________________________________')
};

var activateSubscription = function(accountId, streamName, queueName){
    var tableName = nameGeneratorService.getTableName(accountId, streamName);

    db.newConnection(function (conn) {
        conn.use(dbName);

        r.table(tableName)
            .changes({squash: false})
            .run(conn, function (err, cursor) {
                if (err)
                    eventEmitter.emit('error', {error: err, queueName: queueName})
                else {
                    eventEmitter.emit('ready', queueName, conn);
                    cursor.each(function publishNextEvent(err, event) {
                        if (err)
                            return;

                        if (event.new_val.stream == streamName)
                            publishEvent(queueName, event.new_val);
                    }, function onFinished() {
                        eventEmitter.emit('finished', queueName);
                    })
                }
            })
    });


};

var deactivateSubscription = function(accountId, streamName, queueName){
    var conn = liveConnections[queueName];
    conn.close();
    delete liveConnections[queueName];
    eventEmitter.emit('closed', queueName);
}

var liveConnections = {};

var Changes = {
    subscribe: function(accountId, streamName){
        var self = this;

        var queueName = nameGeneratorService.getQueueName(accountId, streamName);
        activateSubscription(accountId, streamName, queueName);

        eventEmitter.on('ready', function(queueName, connectionObject){
            console.log('Ready Here');
            console.log(queueName);
            console.log(connectionObject);
            liveConnections[queueName] = connectionObject
            console.log("Ready: " + queueName);
        })

        eventEmitter.on('error', function(){
            console.log("Ready: " + queueName);
        })

        eventEmitter.on('close', function(){
            console.log('Connection Closed ' + queueName);
        })

    },

    unsubscribe: function(accountId, streamName){
        var queueName = nameGeneratorService.getQueueName(accountId, streamName);
        deactivateSubscription(accountId, streamName, queueName);
    }
}

process.on('message', function(commandMessage){
    if(commandMessage.command == constants.childProcess.events.subscribe)
        Changes.subscribe(commandMessage.accountId, commandMessage.streamName);
    else if (commandMessage.command = constants.childProcess.events.unsubscribe)
        Changes.unsubscribe(commandMessage.accountId, commandMessage.streamName)
})

module.exports = Changes;


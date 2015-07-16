var db                   = require('./../lib/datastores/rethinkdb/init.js');
var r                    = db.r;
var nameGeneratorService = require('./name_generator_service.js');
var constants            = require('./../config/constants.js');
var events               = require('events');
var eventEmitter         = new events.EventEmitter();
var serviceBus           = require('./../config/servicebus.js');

var internals = {};
internals.liveConnections = {};

var publishEvent = function(queueName, event){
    serviceBus.publish(queueName, event);
}

var activateCatchupStream = function(accountId, streamName,
                                    startSequenceId, endSequenceId,
                                    queueName){
    console.log('activating catchup stream');
    var tableName = nameGeneratorService.getTableName(accountId,
        streamName);

    var streamFinished = function(){
        console.log( "Stream Finished triggerd");
        console.log(queueName);

        publishEvent(queueName, 'streamEnded');
    };

    var fetchStream = function(tableName, fromSequenceId,
                               toSequenceId){
        //var tableName = nameGeneratorService.getTableName(accountId,
        //    streamName);
        var _conn = internals.liveConnections[queueName];
        _conn.use(db.databaseName);

        r.table(tableName)
        .between(fromSequenceId,
                 toSequenceId,
                 {index: 'sequence_id'})
        .run(_conn, function(err, cursor){
            if(err)
                return;
            else
                cursor.each(function(err, event){
                    if (err){
                        console.log(err);
                        publishEvent(queueName, 'streamEnded');
                    }
                    else {
                        publishEvent(queueName, event);
                    }
                }, streamFinished)
        })
    }

    eventEmitter.on('ready', function(){
        console.log('CatchUpStream Ready ' + queueName);
        fetchStream(tableName, startSequenceId, endSequenceId)
    })


    if(!internals.liveConnections[queueName]) {
        console.log('creating a new connection')
        db.newConnection(function (conn) {
            internals.liveConnections[queueName] = conn;
            eventEmitter.emit('ready', queueName);
        });
    }




}

CatchupStreamService = {
    activateCatchupStream: function(accountId, streamName,
                                    startSequenceId, endSequenceId,
                                    queueName){
        console.log('Called Service interface')
        activateCatchupStream(accountId, streamName,
            startSequenceId, endSequenceId,
            queueName);
    }
}


process.on('message', function(commandMessage){
    console.log('++++++++++++++++CommandMessage+++++++++++++++++++++++++++')
    console.log(commandMessage);
    var queueName = nameGeneratorService.getQueueName(commandMessage.accountId,
                                                      commandMessage.streamName);
    console.log(commandMessage.command)
    console.log(constants.childProcess.subscribeCatchupStreamEvent)
    console.log(commandMessage.command == constants.childProcess.subscribeCatchupStreamEvent)
    if(commandMessage.command == constants.childProcess.events.subscribeCatchupStreamEvent) {
        console.log('Subscribe catch stream Event in child process');
        CatchupStreamService.activateCatchupStream(commandMessage.accountId,
            commandMessage.streamName,
            commandMessage.startSequenceId,
            commandMessage.endSequenceId,
            queueName
        )
    }
})


module.exports = CatchupStreamService;
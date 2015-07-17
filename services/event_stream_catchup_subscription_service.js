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
    var resultSetCount = 20;

    var streamFinished = function(){
        console.log( "Stream Finished triggerd");
        console.log(queueName);

        publishEvent(queueName, 'streamEnded');
        closeConnection(queueName);
    };

    var closeConnection = function(queueName){
        var conn = internals.liveConnections[queueName];
        conn.close();
        delete internals.liveConnections[queueName];
    }

    var paginate = function(tableName, limit, previous, leftBound){
        if (!leftBound)
            leftBound = 'open';
        var lastElem = previous + limit;

        return (r.table(tableName)
            .between(previous, lastElem, {
                index: 'sequence_id',
                leftBound: leftBound
            })
            .orderBy('sequence_id'));
    };

    var fetchStream = function(tableName, fromSequenceId,
                               toSequenceId){
        //var tableName = nameGeneratorService.getTableName(accountId,
        //    streamName);
        var _conn = internals.liveConnections[queueName];
        _conn.use(db.databaseName);
        var lastSequenceId = fromSequenceId;

        function fetchAndPublishStream(queueName, tableName, lastSequenceId, leftBound){
            paginate(tableName, resultSetCount, lastSequenceId, leftBound)
            .run(_conn, function(err, cursor){
                if(err) {
                    console.log(err);
                    publishEvent(queueName, 'streamEnded');
                }else{
                    lastSequenceId += resultSetCount;
                    cursor.each(function(err, event){
                        publishEvent(queueName, event);
                    }, function streamEnded() {
                        if(lastSequenceId >= toSequenceId)
                            streamFinished();
                        else
                            fetchAndPublishStream(queueName, tableName, lastSequenceId, 'open');
                    })
                }
            });
        }

        fetchAndPublishStream(queueName, tableName, lastSequenceId, 'closed');


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
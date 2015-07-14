var serviceBus               = require('./../config/servicebus.js');
var constants                = require('./../config/constants.js');
var nameGeneratorService     = require('./name_generator_service.js');
var eventStreamCreateService = require('./event_stream_create_service.js');
var internals = {};

internals.createNewStreamRequested = constants.Commands.createNewStreamRequested;

var listen = function(){
    var sendNotification = function(accountId, streamName, status){
        var channel = nameGeneratorService.getQueueName(accountId, streamName)
        debugger;
        if(status)
            serviceBus.publish(channel, {status: true})
        else
            serviceBus.publish(channel, {status: false});
    }

    var onStreamCreated = function(err, streamCreateStatus, accountId, streamName){
        if(err) {
            console.log(err);
            sendNotification(accountId, streamName, err);
        }
        else {
            console.log("********************")
            console.log(streamCreateStatus);
            sendNotification(accountId, streamName, true);
            console.log("********************")
        }
    }

    var onNewCommand = function(newCommand){
        if (newCommand.command == internals.createNewStreamRequested){
            eventStreamCreateService.create(newCommand.accountId,
                                            newCommand.streamName,
                                            onStreamCreated
                                           )
        }


    };

    serviceBus.subscribe('eventstore.commands', {
        durable: true,
        persistent: true,
        ack: true
    }, function(event){
        console.log(event);
        event.handle.ack();
        onNewCommand(event.data);
    });

    console.log('CommandListenerService initialized');
}

var CommandListenerService = {
    init: function(){
        listen();
    }
}

module.exports = CommandListenerService;
var serviceBus               = require('./../config/servicebus.js');
var constants                = require('./../config/constants.js');
var nameGeneratorService     = require('./name_generator_service.js');
var eventStreamCreateService = require('./event_stream_create_service.js');
var internals = {};

internals.createNewStreamRequested = constants.Commands.createNewStreamRequested;
internals.newEvent                 = constants.Commands.newEvent;

var listen = function(){
    var sendNotification = function(accountId, streamName, status){
        var channel = nameGeneratorService.getQueueName(accountId, streamName) + ".responses"

        if(status)
            serviceBus.publish(channel, {status: true})
        else
            serviceBus.publish(channel, {status: false});
    }

    var onStreamCreated = function(err, streamCreateStatus, accountId, streamName){
        if(err)
            sendNotification(accountId, streamName, err);
        else
            sendNotification(accountId, streamName, true);

    }

    var onNewEventValidated = function(err, validStatus, accountId, streamName){

    }

    var onNewCommand = function(newCommand){
        switch(newCommand.command){
            case internals.createNewStreamRequested:
                eventStreamCreateService.create(newCommand.accountId,
                    newCommand.streamName,
                    onStreamCreated
                )
                break;

            case internals.newEvent:


                break;

        }

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
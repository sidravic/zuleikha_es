var serviceBus = require('./../config/servicebus.js');
var constants = require('./../config/constants.js');
var eventStreamCreateService = require('./event_stream_create_service.js');
var internals = {};

internals.createNewStreamRequested = constants.Commands.createNewStreamRequested;

var listen = function(){
    var onStreamCreated = function(err, streamCreateStatus){

        if(err)
            console.log(err);
        else
            console.log("********************")
            console.log(streamCreateStatus);
            console.log("********************")
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
var serviceBus               = require('./../config/servicebus.js');
var constants                = require('./../config/constants.js');
var nameGeneratorService     = require('./name_generator_service.js');
var eventStreamCreateService = require('./event_stream_create_service.js');
var validateAndPersistPipelineService = require('./validate_and_persist_pipeline_service.js');
var _ = require('lodash');
var internals = {};

internals.createNewStreamRequested = constants.Commands.createNewStreamRequested;
internals.newEvent                 = constants.Commands.newEvent;

var listen = function(){
    var sendNotification = function(accountId, streamName,
                                    status, message, event){
        var channel = nameGeneratorService.getQueueName(accountId, streamName) + ".responses"
        debugger;
        if(message == undefined)
            message = {};

        if(event == undefined)
            event = {};

        if(status)
            serviceBus.publish(channel, {status: true,
                                         message: 'success',
                                         event: event
                                        })
        else
            serviceBus.publish(channel, {status: false,
                                         message: message,
                                         event: event
                                        });
    }

    var onStreamCreated = function(err, streamCreateStatus, accountId, streamName, event){
        var _event = { command: internals.createNewStreamRequested,
                       eventStatus: event
                     };

        if(err)
            sendNotification(accountId, streamName,
                             err, err.message, _event);
        else
            sendNotification(accountId, streamName,
                                true, 'success', _event);
    }

    var onEventPersisted = function(err, persistedEvent){
        var _event = { command: internals.newEvent,
                       event: persistedEvent,
                     };

        if(err && (err.name == 'ValidationError')){
            var errMessage = _.map(err.details, function(error){
                return error.message;
            })
            sendNotification(persistedEvent.accountId,
                             persistedEvent.stream,
                             false,
                             errMessage.join('. '),
                             _event)
        }else if(err){
            console.log(err);
            sendNotification(persistedEvent.accountId,
                persistedEvent.stream,
                false,
                'Bad Request',
                _event)
        }else{
            sendNotification(persistedEvent.accountId,
                             persistedEvent.stream,
                             true,
                            'success', _event)
        }
    }

    var onNewCommand = function(newCommand){
        switch(newCommand.command){
            case internals.createNewStreamRequested:
                debugger;
                eventStreamCreateService.create(newCommand.accountId,
                    newCommand.streamName,
                    onStreamCreated
                )
                break;

            case internals.newEvent:
                validateAndPersistPipelineService.save(newCommand.accountId,
                    newCommand.streamName,
                    newCommand.eventAttributes,
                    onEventPersisted)
                break;
            default:
                break
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
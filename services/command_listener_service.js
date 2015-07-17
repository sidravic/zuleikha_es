var serviceBus               = require('./../config/servicebus.js');
var constants                = require('./../config/constants.js');
var nameGeneratorService     = require('./name_generator_service.js');
var eventStreamCreateService = require('./event_stream_create_service.js');
var validateAndPersistPipelineService = require('./validate_and_persist_pipeline_service.js');
var childProcess             = require('child_process');
var _ = require('lodash');
var internals = {};

internals.createNewStreamRequested = constants.Commands.createNewStreamRequested;
internals.newEvent                 = constants.Commands.newEvent;
internals.subscribeEvent           = constants.Commands.subscribeEvent;
internals.unsubscribeEvent         = constants.Commands.unsubscribeEvent;
internals.subscribeCatchupStreamEvent   = constants.Commands.subscribeCatchupStreamEvent;
internals.unsubscribeCatchupStreamEvent = constants.Commands.unsubscribeCatchupStreamEvent;
internals.subscriptionServiceProcess = null;

var forkChildProcess = function(subscriptionServiceFile){
    debugger;
    var child = childProcess.fork(subscriptionServiceFile);
    console.log('Child process forked');
    return child;
};

var setupExitListeners = function(child){
    console.log('Setuping listeners');
    child.on('exit', function(){
        console.log("Child Process Crashed");
        internals.subscriptionServiceProcess = null;
        forkAndLaunchSubscriptionService();
    });

    child.on('message', function(msg){
        console.log('Message from child process');
        console.log(msg);
    })
};

var setupCatchupExitListeners = function(child){
    console.log('setuping Catchup Exit Listeners');
    child.on('exit', function(){
        internals.catchupSubscriptionServiceProcess = null;
        forkAndLaunchCatchupService();
    })

    child.on('message', function(msg){
        console.log('Message from child process');
        console.log(msg);
    })
}

var forkAndLaunchSubscriptionService = function(){
    var child = forkChildProcess( "./services/event_stream_subscription_service.js");

    if(child) {
        internals.subscriptionServiceProcess = child;
        setupExitListeners(child);
    }
};


var forkAndLaunchCatchupService = function(){
    var child = forkChildProcess("./services/event_stream_catchup_subscription_service.js");

    if(child) {
        internals.catchupSubscriptionServiceProcess = child;
        setupCatchupExitListeners(child);
    }

}


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
    };

    var subscribeToStream = function(accountId, streamName){
        console.log('Sending process message to subscribe to stream');
        internals.subscriptionServiceProcess.send({
            command: constants.childProcess.events.subscribe,
            accountId: accountId,
            streamName: streamName
        })


    };

    var unsubscribeFromStream = function(accountId, streamName){
       internals.subscriptionServiceProcess.send({
           command: constants.childProcess.events.unsubscribe,
           accountId: accountId,
           streamName: streamName
       });
    };

    var subscribeToCatchupStream = function(accountId, streamName,
                                           streamStartSequenceId, streamEndSequenceId){
        internals.catchupSubscriptionServiceProcess.send({
            command: constants.childProcess.events.subscribeCatchupStreamEvent,
            accountId: accountId,
            startSequenceId: streamStartSequenceId,
            endSequenceId: streamEndSequenceId,
            streamName: streamName
        });
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
            case internals.subscribeEvent:
                subscribeToStream(newCommand.accountId,
                                  newCommand.streamName);
                break;
            case internals.unsubscribeEvent:
                unsubscribeFromStream(newCommand.accountId,
                                      newCommand.streamName)
                break;
            case internals.subscribeCatchupStreamEvent:
                console.log('Catch Stream Request arrived');
                console.log(newCommand);
                subscribeToCatchupStream(newCommand.accountId,
                    newCommand.streamName,
                    newCommand.startSequenceId,
                    newCommand.endSequenceId);
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
        forkAndLaunchSubscriptionService();
        forkAndLaunchCatchupService();
    }
}

module.exports = CommandListenerService;
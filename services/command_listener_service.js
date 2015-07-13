var serviceBus = require('./../config/servicebus.js');

var listen = function(){
    var onNewCommand = function(newCommand){
        console.log(newCommand);
    };

    serviceBus.subscribe('eventstore.commands', {
        durable: true,
        persistent: true,
        ack: true
    }, function(event){
        console.log(event);
        event.handle.ack();
        onNewCommand(event);
    });

    console.log('CommandListenerService initialized');
}

var CommandListenerService = {
    init: function(){
        listen();
    }
}

module.exports = CommandListenerService;
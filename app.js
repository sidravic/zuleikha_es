
var Hapi = require('hapi');
var util = require('util');
//var db   = require('./lib/datastores/rethinkdb/init.js');
var C = require('./lib/datastores/rethinkdb/connection.js');
var server = new Hapi.Server();

C.createConnection(startServer);
module.exports = server;

function startServer(dbConn){
    console.log("Start server started Connection Open " + dbConn.open);
    console.log('Connection available');
    if(process.env.NODE_ENV != 'REPL')
        server.connection({port: 4005});
        server.start(function(){
            console.log('Server connected to port ' + server.info.uri);

            var serviceBus = require('./config/servicebus.js');
            var commandListenerService = require('./services/command_listener_service.js');
            var constants = require('./config/constants.js');
            commandListenerService.init();

            console.log('Subscribing...');
            console.log('subscribing...');
            var nameS = require('./services/name_generator_service.js');
            var channelName = nameS.getQueueName('42d19749-fb48-4373-8f7a-b80170255644',
                                                'test_stream_10')
            console.log("SUBSCRIBED TO CHANNEL " + channelName);
            serviceBus.subscribe(channelName, function(event){
                console.log(' ======================================================================= ')
                console.log(util.inspect(event));
                console.log(' ======================================================================= ')
            })


            console.log('subscribing to the event stream');
            //serviceBus.publish('eventstore.commands', {
            //    command: 'subscribeEvent',
            //    accountId: '42d19749-fb48-4373-8f7a-b80170255644',
            //    streamName: 'test_stream_10'
            //});

            var subscriptionQueueName = channelName + '.responses'


            //setTimeout(function(){
            //    serviceBus.publish('eventstore.commands',{
            //        command:'unsubscribeEvent',
            //        accountId: '42d19749-fb48-4373-8f7a-b80170255644',
            //        streamName: 'test_stream_10'
            //    })
            //}, 10000)


            serviceBus.publish('eventstore.commands', {
                accountId: '42d19749-fb48-4373-8f7a-b80170255644',
                streamName: 'test_stream_10',
                startSequenceId: 1000,
                endSequenceId: 2000,
                command: 'subscribeCatchupStreamEvent'
            })


            //var i =0;
            //setInterval(function(){
            //    ++i;
            //
            //    serviceBus.publish('eventstore.commands', {
            //        command: 'newEvent',
            //        accountId: '42d19749-fb48-4373-8f7a-b80170255644',
            //        streamName: 'test_stream_10',
            //        eventAttributes: {
            //            timestamp: new Date(),
            //            number: i
            //        }
            //    })
            //}, 4000)



        });


}



var Hapi   = require('hapi');
var util   = require('util');
var Path   = require('path');
var Yar    = require('yar');
var logger = require('./config/logger.js');
//var db   = require('./lib/datastores/rethinkdb/init.js');
var C      = require('./lib/datastores/rethinkdb/connection.js');
var AccountsApp = require('./lib/web/accounts');
var Api         = require('./lib/web/api');
var CommandListenerService = require('./services/command_listener_service.js');


var server = new Hapi.Server({
        debug: { request: ['error', 'uncaught'] }
     });


C.createConnection(startServer);

function startServer(dbConn){
    if(process.env.NODE_ENV != 'REPL')
        if(!process.env.cookieOptionsPassword)
            process.env.cookieOptionsPassword = 'piperatthegatesofdawniscallingyouhisway';

        console.log("Start server started Connection Open " + dbConn.open);
        console.log('Connection available');
        var port = process.env.PORT || 4005;
        server.connection({port: port});
        var yarOptions = {
            name: '_zuleikha_es_flash',
            cookieOptions: {
                password: 'piperatthegatesofdawniscallingyouhisway',
                isSecure: false,
            }
        }


        server.register([{
            register: Yar,
            options: yarOptions
        },{
            register: AccountsApp,
            options: {}
        },{
            register: Api,
            options: {}
        }], function(err){
            if(err)
                throw err;
        })


        process.on('uncaughtException', function(err){
            console.log(err);
            throw err;
        })


        server.start(function(){
            var commandListenerInitialized = function(){
                console.log('Server connected to port ' + server.info.uri);
                //var serviceBus = require('./config/servicebus.js');
                //
                //var constants = require('./config/constants.js');
                //commandListenerService.init();
                //console.log('Started Command Listener');
                //
                //var nameS = require('./services/name_generator_service.js');
                //var channelName = nameS.getQueueName('42d19749-fb48-4373-8f7a-b80170255644',
                //                                    'test_stream_10')
                //console.log("SUBSCRIBED TO CHANNEL " + channelName);
                //
                //
                //serviceBus.subscribe(channelName, function(event){
                //    console.log(' ======================================================================= ')
                //    console.log(util.inspect(event));
                //    console.log(' ======================================================================= ')
                //})
                //
                //
                //
                //
                //var subscriptionQueueName = channelName + '.responses'


                //setTimeout(function(){
                //    serviceBus.publish('eventstore.commands',{
                //        command:'unsubscribeEvent',
                //        accountId: '42d19749-fb48-4373-8f7a-b80170255644',
                //        streamName: 'test_stream_10'
                //    })
                //}, 10000)

                console.log('Sending subscribeCatchupStreamEvent');
                //serviceBus.publish('eventstore.commands', {
                //    accountId: '42d19749-fb48-4373-8f7a-b80170255644',
                //    streamName: 'test_stream_10',
                //    startSequenceId: 1000,
                //    endSequenceId: 2000,
                //    command: 'subscribeCatchupStreamEvent'
                //})


                /*var i =0;
                 setInterval(function(){
                 ++i;

                 serviceBus.publish('eventstore.commands', {
                 command: 'newEvent',
                 accountId: '42d19749-fb48-4373-8f7a-b80170255644',
                 streamName: 'test_stream_10',
                 eventAttributes: {
                 timestamp: new Date(),
                 number: i
                 }
                 })
                 }, 12)*/
            }

            CommandListenerService.init(commandListenerInitialized);

        });
}

module.exports = server;
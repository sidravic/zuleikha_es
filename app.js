
var Hapi = require('hapi');
var util = require('util');
var Path = require('path');
var Yar  = require('yar');
var logger = require('./config/logger.js');
//var db   = require('./lib/datastores/rethinkdb/init.js');
var C = require('./lib/datastores/rethinkdb/connection.js');
var AccountsApp = require('./lib/web/accounts');
var server = new Hapi.Server({debug: {
                                       request: ['error', 'uncaught']
                                     }
                             });


C.createConnection(startServer);
module.exports = server;

function startServer(dbConn){
    if(process.env.NODE_ENV != 'REPL')
        if(!process.env.cookieOptionsPassword)
            process.env.cookieOptionsPassword = 'piperatthegatesofdawniscallingyouhisway';
        console.log("Start server started Connection Open " + dbConn.open);
        console.log('Connection available');
        server.connection({port: 4005});

        server.register([{
            register: Yar,
            options: {
                cookieOptions: {
                    password: process.env.cookieOptionsPassword
                }
            }
        },{
          register: require('crumb'),
          options: {}
        },{
            register: AccountsApp,
            options: {}
        }], function(err){
            if(err)
                throw err;
        })


        process.on('uncaughtException', function(err){
            throw err;
        })

        server.start(function(){
            console.log('Server connected to port ' + server.info.uri);

            var serviceBus = require('./config/servicebus.js');
            var commandListenerService = require('./services/command_listener_service.js');
            var constants = require('./config/constants.js');
            commandListenerService.init();
            console.log('Started Command Listener');

            var nameS = require('./services/name_generator_service.js');
            var channelName = nameS.getQueueName('42d19749-fb48-4373-8f7a-b80170255644',
                                                'test_stream_10')
            console.log("SUBSCRIBED TO CHANNEL " + channelName);
            serviceBus.subscribe(channelName, function(event){
                console.log(' ======================================================================= ')
                console.log(util.inspect(event));
                console.log(' ======================================================================= ')
            })




            var subscriptionQueueName = channelName + '.responses'


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


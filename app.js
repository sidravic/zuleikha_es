
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


            //var C = require('./lib/datastores/rethinkdb/changes.js');
            //
            //setTimeout(function(){
            //    console.log("Subscribing to the stream now")
            //    C.subscribe('test_stream')
            //}, 4000);
            //
            //setTimeout(function(){
            //    var P = require('./lib/datastores/rethinkdb/persistence.js');
            //
            //    setInterval(function(){
            //        var time = new Date();
            //        var datadump = Math.random() * 1000;
            //
            //        P.save('test_stream', {datadump: datadump,
            //                time: time},
            //            function(err, insertedValue){
            //                if(err)
            //                    throw err;
            //                else
            //                    console.log('Inserted Value ' + util.inspect(insertedValue));
            //            });
            //
            //    }, 12)
            //}, 4000)

            var serviceBus = require('./config/servicebus.js');
            var commandListenerService = require('./services/command_listener_service.js');
            var constants = require('./config/constants.js');
            commandListenerService.init();
            //
            console.log('Subscribing...');
            console.log('subscribing...');
            var nameS = require('./services/name_generator_service.js');
            var channelName = nameS.getQueueName('42d19749-fb48-4373-8f7a-b80170255644',
                                                'test_stream_32')
            var subscriptionQueueName = channelName + '.responses'
            console.log('____________________________')
            console.log(subscriptionQueueName);
            console.log('____________________________')
            serviceBus.subscribe(subscriptionQueueName, function(event){
                console.log('++++++++++++++++')
                console.log(event);
                console.log('++++++++++++++++')
            });
            //
            //
            //var i = 0;
            //setInterval(function(){
            //    ++i;
            //
            //    serviceBus.publish('eventstore.commands', {
            //        accountId: '42d19749-fb48-4373-8f7a-b80170255644',
            //        streamName: 'test_stream_11',
            //        command: 'createNewStreamRequest',
            //        id: i,
            //        payload: {
            //            name: 'siddharth',
            //            email: 'siddharth@idyllic-software.com',
            //            age: 31
            //        }
            //    })
            //}, 3000)


            //var vp =  require('./services/validate_and_persist_pipeline_service.js');
            //vp.save('42d19749-fb48-4373-8f7a-b80170255644', 'test_stream_10',
            //    { _createdAt: new Date() })

            serviceBus.publish('eventstore.commands', {
                command: 'newEvent',
                accountId: '42d19749-fb48-4373-8f7a-b80170255644',
                streamName: 'test_stream_32',
                eventAttributes: {
                    timestamp: new Date()
                }
            })


        });


}


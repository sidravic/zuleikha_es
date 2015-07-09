
var Hapi = require('hapi');
var util = require('util');
//var db   = require('./lib/datastores/rethinkdb/init.js');
var C = require('./lib/datastores/rethinkdb/connection.js');
var server = new Hapi.Server();


C.createConnection(startServer);

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


        });


}


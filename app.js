var db = require('./lib/datastores/rethinkdb/init.js');
var net = require('net');

var server = net.createServer();
module.exports = server;

if(process.env.NODE_ENV != 'REPL')
    server.listen(4005, function(){
        console.log('Server connected to port ' + server.address().port);

        C = require('./lib/datastores/rethinkdb/changes.js');

        C.subscribe('test_stream')
    });


var db = require('./config/database.js');
var net = require('net');

var server = net.createServer();
server.listen(4005, function(){

    console.log('Server connected to port ' + server.address().port);
});


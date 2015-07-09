var db = require('./init.js');
var util = require('util');
db.setup(databaseSetupFinished);

function databaseSetupFinished(){
    createConnection()
}

function createConnection(cb){
    db.Connection(function(conn){
        if(cb)
            cb(conn);
    })
}


var C = {
    createConnection: createConnection
}






module.exports = C;
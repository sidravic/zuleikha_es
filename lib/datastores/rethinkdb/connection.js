var db = require('./init.js');
var util = require('util');

var internals = {};

internals.setupDatabase = function(cb){
    db.setup(cb)
}

internals.databaseSetupFinished = function(){
    internals.createConnection()
}

internals.createConnection = function(cb){
    db.Connection(function(conn){
        if(cb)
            cb(conn);
    })
}

var init = function(callback){
    internals.setupDatabase(function(conn){
        if(conn && conn.open) {
            callback(conn)
        }
        else{
            internals.createConnection(function(conn){
                callback(conn);
            })
        }
    })
}


var C = {
    createConnection: init
}






module.exports = C;
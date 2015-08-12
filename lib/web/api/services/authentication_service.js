var constants = require('./../../../../config/constants.js');
var db        = require('./../../../datastores/rethinkdb/init.js');
var r         = db.r;
var dbName    = db.databaseName;
var accountsTable = constants.accountsTableName;
var exec      = db.exec;
var _         = require('lodash');


var AuthenticationService = {
    authenticate: function(token, callback){
        exec(function(conn){
            conn.use(dbName);

            r.table(accountsTable)
                .filter({accountToken: token})
                .run(conn, function(err, cursor){
                    if (err) {
                        debugger;
                        callback(err, false, null);
                    }
                    else{
                        cursor.toArray(function(err, accounts){
                            debugger;
                            if(_.isEmpty(accounts)){
                                debugger;
                                callback(null, false, null);
                            }else if(accounts.length > 1) {
                                var nonUniqueAccessTokenError = new Error('Access Token not unique');
                                callback(nonUniqueAccessTokenError, false, null);
                            }else{
                                var authorizedAccount = accounts[0];
                                debugger;
                                callback(null, true, authorizedAccount);;
                            }

                        })
                    }
                })
        })
    }
};

module.exports = AuthenticationService;
var db   = require('./../../../../lib/datastores/rethinkdb/init.js');
var exec = db.exec;
var r    = db.r;
var constants = require('./../../../../config/constants.js');
var accountsTableName = constants.accountsTableName;

var SessionHelperService = {
    getCurrentUser: function(request, cb){
        if(request.auth.isAuthenticated){
            var accountId = request.auth.credentials['_accId'];
            exec(function(conn){
                r.table(accountsTableName)
                    .filter({id: accountId})
                    .limit(1)
                    .run(conn, function(err, cursor){
                        if(err)
                            cb(err, null)
                        else {
                            cursor.toArray(function(err, accounts){
                                if(err)
                                    cb(err, null)
                                else{
                                    var account = accounts[0];
                                    cb(null, account);
                                }

                            });
                        }
                    })
            })
        }
    }
}


module.exports = SessionHelperService;
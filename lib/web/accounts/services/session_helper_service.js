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
                    .get(accountId)
                    .run(conn, function(err, account){
                        debugger;
                        if(err)
                            cb(err, null)
                        else {
                            cb(null, account);
                        }
                    })
            })
        }
    }
}


module.exports = SessionHelperService;
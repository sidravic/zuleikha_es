var db      = require('./../../../datastores/rethinkdb/init.js');
var r       = db.r;
var exec    = db.exec;
var constants     = require('./../../../../config/constants.js');
var accountsTable = constants.accountsTableName;
var _             = require('lodash');
var bcrypt        = require('bcrypt');
var accountPersistenceService = require('./account_persistence.js');
var async         = require('async');
var Logger        = require('./../config/logger.js');

var AccountServices = {
    emailExists: function(email, callback){
        exec(function(conn){
            r.table(accountsTable)
                .filter({email: email})
                .run(conn, function(err, cursor){
                    if(err) {
                        callback(err, null)
                    }
                    else {
                        cursor.toArray(function (err, user) {
                            if (err)
                                callback(err, null);
                            else {
                                var exists = !(_.isEmpty(user));
                                if (!exists) {
                                    callback(null, exists);
                                }
                                else {                                    
                                    var accountExistsError = new Error('Account already exists with that email');
                                    callback(accountExistsError, null);
                                }
                            }
                        })
                    }
                })
        })
    },

    signup: function(account, cb){
        var self = this;

        var onAccountCreated = function(err, account){
            console.log('On account created called');
            cb(err, account);
        }

        var onEncrypted = function(err, encryptedPassword){
            if(err){
                Logger.error(['account_services.js'], err.message + "\n " + err.stack)
                var error = new Error('Internal server error')
                cb(error, null);
            }
            else {
                db.uuid(function(err, uuid){
                    account.id = uuid;
                    account.encryptedPassword = encryptedPassword;
                    delete account.password;
                    delete account.passwordConfirmation
                    accountPersistenceService.createAccount(account, onAccountCreated);
                })
            }
        };

        self.encryptPassword(account.password, onEncrypted)
    },

    encryptPassword: function(password, cb){
        var salt;
        bcrypt.genSalt(10, function(err, _salt){
            salt = _salt;

            bcrypt.hash(password, salt, function(err, res){
                if(err){
                    cb(err, null, null);
                }else{
                    cb(null, res)
                }
            })
        })
    },

    findBy: function(parameter, value, cb){
        var filterParam = {};
            filterParam[parameter] = value;

        exec(function(conn){
            r.table('accounts')
                .filter(filterParam)
                .limit(1)
                .run(conn, function(err, cursor){
                    if(err)
                        cb(err, null);
                    else
                        cursor.toArray(function(err, result){
                            if(err)
                                cb(err, null);
                            else
                                cb(err, result[0]);
                        })
                })

        })
    },

    authenticate: function(email, password, callback){
        var self = this;
        async.waterfall([
            function findUserByEmail(cb){
                self.findBy('email', email, cb)
            },

            function auth(user, cb){
                bcrypt.compare(password, user.encryptedPassword, function(err, isAuthenticated){
                    if(isAuthenticated)
                        cb(err, user);
                    else
                        cb(err, null);
                })
            }
        ], function(err, user){
            if(err)
                callback(err, null);
            else
                callback(null, user)
        })
    },

    addStream: function(accountId, streamName, cb){
        var self = this;
        debugger
        exec(function(conn){
            r.table(accountsTable)
             .filter({id: accountId})
             .update({streams: r.row('streams').setInsert(streamName)})
             .run(conn, cb);
        });
    }
}

module.exports = AccountServices;
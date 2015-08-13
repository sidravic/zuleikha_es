var Joi        = require('joi');
var constants  = require('./../../../../config/constants.js');
var db         = require('./../../../datastores/rethinkdb/init.js');
var exec       = db.exec;
var r          = db.r;
var accountsTable = constants.accountsTableName;


var validateParameters = function(account, cb){
    debugger;
    var accountSchema = Joi.object().keys({
        id: Joi.string().required(),
        email: Joi.string().email().required(),
        encryptedPassword: Joi.string().required(),
        streams: Joi.array().items(Joi.string()).min(0).unique(),
        accountToken: Joi.string().required(),
        privateKey: Joi.string().optional().allow(null),
        createdAt: Joi.date(),
        updatedAt: Joi.date().optional().allow(null)
    });
    debugger;
    Joi.validate(account.attributes(), accountSchema, {
            abortEarly: false,
            allowUnknown: true
    }, function(err, value){
        debugger;
        if(err){
            cb(err, value);
        }else{
            cb(null, value);
        }
    })
}

var AccountPersistence = {
    createAccount: function(account, cb){
        debugger;
        var onSave = function(err, insertChanges){
            console.log('ON SAVE CALLED');
            debugger;
            if(err){
                cb(err, null);
            }else{
                if(insertChanges.exists == 1){
                    var emailExistsError = new Error('Account already exists');
                    cb(emailExistsError, null);
                }else{
                    cb(null, true);
                }
            }
        };

        var persist = function(account){

            debugger;
            //exec(function(conn){
            //    r.table(accountsTable)
            //        .insert(account, {
            //            conflict: 'error',
            //            durability: 'hard',
            //            returnChanges: true
            //        })
            //        .run(conn, onSave);
            //})

            exec(function(conn){
                r.table(accountsTable)
                    .get(account.email)
                    .do(function(_account){
                        return r.branch(_account,
                                        {exists: 1},
                                        (r.table(accountsTable).insert(account, {
                                            conflict: 'error',
                                            durability: 'hard',
                                            returnChanges: true
                                        }))

                        )
                    }).run(conn, onSave)
            })
        };

        var isValid = function(err, account){
            if(err){
                cb(err, account);
            }else{
                delete account.password;
                delete account.passwordConfirmation;

                persist(account);
            }
        };

        validateParameters(account, isValid)
    }
};

module.exports = AccountPersistence;
var Joi        = require('joi');
var constants  = require('./../../../../config/constants.js');
var db         = require('./../../../datastores/rethinkdb/init.js');
var exec       = db.exec;
var r          = db.r;
var accountsTable = constants.accountsTableName;


var validateParameters = function(account, cb){
    var accountSchema = Joi.object().keys({
        email: Joi.string().email().required(),
        encryptedPassword: Joi.string().required(),
        streams: Joi.array().items(Joi.string()).min(0).unique(),
        accountToken: Joi.string().required(),
        privateKey: Joi.string().optional().allow(null),
        createdAt: Joi.date(),
        updatedAt: Joi.date().optional().allow(null)
    });

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
    save: function(account, cb){
        debugger;
        var onSave = function(err, insertChanges){
            console.log('ON SAVE CALLED');
            if(err){
                cb(err, null);
            }else{
                cb(null, insertChanges.changes[0].new_val);
            }
        };

        var persist = function(account){
            //delete account.id;
            //delete account.privateKey;
            //delete account.accountToken;
            //delete account.password;
            //delete account.passwordConfirmation;
            //
            //account.createdAt    = new Date();
            //account.updatedAt    = new Date();
            //account.accountToken = accountTokenGeneratorService.generateSync()
            //account.streams      = []
            debugger;
            exec(function(conn){
                r.table(accountsTable)
                    .insert(account, {
                        conflict: 'error',
                        durability: 'hard',
                        returnChanges: true
                    })
                    .run(conn, onSave);
            })
        };

        var isValid = function(err, account){
            if(err){
                cb(err, account);
            }else{
                delete account.id;
                delete account.password;
                delete account.passwordConfirmation;

                persist(account);
            }
        };

        validateParameters(account, isValid)
    }
};

module.exports = AccountPersistence;
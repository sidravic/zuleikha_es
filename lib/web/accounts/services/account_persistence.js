var Joi        = require('joi');
var constants  = require('./../../../../config/constants.js');
var db         = require('./../../../datastores/rethinkdb/init.js');
var exec       = db.exec;
var r          = db.r;
var accountsTable = constants.accountsTableName

var validateParameters = function(account, cb){
    var accountSchema = Joi.object().keys({
        email: Joi.string().email().required(),
        encryptedPassword: Joi.string().required(),
        salt: Joi.string().required()
    });


    Joi.validate(account.attributes(), accountSchema, {
            abortEarly: false,
            allowUnknown: true
    }, function(err, value){
        console.log(err);
        if(err){
            cb(err, value);
        }else{
            cb(null, value);
        }
    })


}

var AccountPersistence = {
    save: function(account, cb){
        var onSave = function(err, insertChanges){
            console.log('ON SAVE CALLED');
            if(err){
                cb(err, null);
            }else{
                cb(null, insertChanges.changes[0].new_val);
            }
        };

        var persist = function(account){
            delete account.id;
            delete account.privateKey;
            delete account.accountToken;

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
                debugger;
                persist(account);
            }
        };

        debugger;
        validateParameters(account, isValid)
    }
};

module.exports = AccountPersistence;
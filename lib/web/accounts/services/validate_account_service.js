var Account = require('./../models/account.js');
var Joi     = require('joi');
var db      = require('./../../../datastores/rethinkdb/init.js');
var r       = db.r;
var exec    = db.exec;
var constants = require('./../../../../config/constants.js');
var accountServices = require('./account_services.js');


var newAccountSchema = Joi.object().keys({
    email: Joi.string().email(),
    password: Joi.string().min(6).max(22),
    password_confirmation: Joi.string().min(6).max(22)
});

var ValidateAccountService = {
    isValid: function(account, callback){
        var self = this;
        var errors = [];

        var onValidated = function(err, _validatedAccount){
            console.log(err);
            if (err) {
                errors = err.details;
                callback(err, false);
            }
            else{
                if (account.password != account.passwordConfirmation) {
                    var err = new Error('Password should match password confirmation');
                    callback(err, false);
                }else{
                    callback(null, true);
                }

            }
        };

        Joi.validate(account, newAccountSchema, {
            abortEarly: false
        }, onValidated)
    }


}

module.exports = ValidateAccountService;
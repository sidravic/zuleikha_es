var Account = require('./../models/account.js');
var Joi     = require('joi');
var db      = require('./../../../datastores/rethinkdb/init.js');
var r       = db.r;
var exec    = db.exec;
var constants = require('./../../../../config/constants.js');
var accountServices = require('./account_services.js');


var newAccountSchema = Joi.object().keys({
    email: Joi.string().email(),
    password: Joi.string().min(6).max(22).label('Password'),
    password_confirmation: Joi.any().valid(Joi.ref('password'))
                              .required()
                              .options({language: { any: {
                                                            allowOnly: 'must match Password'
                                                         },
                                                    label: 'Password Confirmation'
                                                  },
                                         })
});

var AccountCreationParametersValidateService = {
    isValid: function(account, callback){
        var self = this;
        var errors = [];

        var onValidated = function(err, _validatedAccount){            
            if(err)
                callback(err, false);
            else
                callback(null, true);


        };

        Joi.validate(account, newAccountSchema, {
            abortEarly: false
        }, onValidated)
    }


}

module.exports = AccountCreationParametersValidateService;
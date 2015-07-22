var validateAccountService = require('./../services/validate_account_service.js');
var async                  = require('async');
var Account                = require('./../models/account.js');
var accountServices        = require('./../services/account_services.js');
module.exports.index = {
    description: 'Root URL',
    handler: function(request, response){
        response.view('index');
    }
};


module.exports.create = {
    description: 'Account Creation URL',

    handler: function(request, response){
        var payload = request.payload;
        var account = new Account(payload);

        async.waterfall([
            function validateAccount(cb){
               validateAccountService.isValid(payload, cb);
            },
            function checkEmailExists(isValid, cb){
                console.log('checkEmailExists ' + isValid);
                accountServices.emailExists(account.email, cb);
            },
            function signup(emailExists, cb){
                console.log('signup ' + emailExists);
                accountServices.signup(account, cb)
            }
        ], function(err, result){
            console.log('Final callback called');
            console.log("Logging results");
            console.log(result);
            if(err){
                response.view('new', {errorMessages: err})
            }else{
                response({status: 'success'});
            }

        });
    }
}


module.exports.new = {
    description: 'Form for creating a new account',
    handler: function(request, response){
        response.view('new');
    }
}

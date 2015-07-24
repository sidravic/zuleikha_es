var accountCreationParametersValidateService = require('./../services/account_creation_parameters_validate_service.js');
var async            = require('async');
var Account          = require('./../models/account.js');
var accountServices  = require('./../services/account_services.js');
var _                = require('lodash');
var sessionHelper    = require('./../services/session_helper_service.js');

module.exports.index = {
    description: 'Root URL',
    plugins: {
      'hapi-auth-cookie': {redirectTo: false}
    },
    auth: {
        mode: 'try',
        strategy: 'session'
    },
    handler: function(request, response){
        debugger;
        if(request.auth.isAuthenticated){
            var currentAccountId = request.auth.credentials['_accId']
            response.redirect('/accounts/' + currentAccountId);
        }else{
            response.view('index');
        }

    }
};

module.exports.login = {
    description: 'Authentication',
    plugins: {
      'hapi-auth-cookie': {redirectTo: false}
    },
    auth: {
        mode: 'try',
        strategy: 'session'
    },
    handler: function(request, response){
        var payload = request.payload
        var onAuthenticated = function(err, user){
            if(err)
                response.view('index');
            else {
                request.auth.session.set({_accId: user.id});
                request.session.set("_accId", user.id);
                response.redirect('/accounts/' + user.id);
            }
        }

        if(request.auth.isAuthenticated){
            var currentAccountId = request.auth.credentials['_accId']
            response.redirect('/accounts/' + currentAccountId);
        }else {
            accountServices.authenticate(payload.email, payload.password, onAuthenticated)
        }
    }
}


module.exports.create = {
    description: 'Account Creation URL',
    auth: {
        mode: 'try',
        strategy: 'session'
    },
    handler: function(request, reply){
        var payload = request.payload;
        var account = new Account(payload);

        if(request.auth.isAuthenticated){
           var currentAccountId = request.auth.credentials['_accId']
           reply.redirect('/account/' + currentAccountId);
        }else{
            async.waterfall([
                function validateAccount(cb){
                    accountCreationParametersValidateService.isValid(payload, cb);
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
                if(err && err.details){
                    var messages = _.select(err.details, function(error){
                        return error.message;
                    })
                    reply.view('new', {errorMessages: messages, _: _});
                }else if(err){
                    var messages = []
                    messages.push(err);
                    reply.view('new', {errorMessages: messages, _: _});
                }
                else{
                    reply.redirect('/');
                }
            });
        }


    }
}


module.exports.new = {
    description: 'Form for creating a new account',
    plugins: {
        'hapi-auth-cookie': {redirectTo: false}
    },
    auth: {
        mode: 'try',
        strategy: 'session'
    },
    handler: function(request, response){
        response.view('new');
    }
}

module.exports.show = {
    description: 'Displays information to the logged in user',
    auth: 'session',
    handler: function(req, reply){
        sessionHelper.getCurrentUser(req, function(err, account){
            reply.view('show', {
                id: account.id,
                email: account.email
            })
        })
    }
}

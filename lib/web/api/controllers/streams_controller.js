var accountsService = require('./../services/accounts_service.js');
var async           = require('async');
var Joi             = require('joi');

module.exports.index = {
    description: 'Returns all streams created by the user',
    auth: 'simple',
    handler: function(request, reply){
        var accountId = request.auth.credentials.id;

        var onAccount = function(err, account){
            if(err){
                reply({
                    accountToken: request.auth.credentials.accountToken,
                    requestStatus: 'failure',
                    error: 'Internal Server Error'
                }).type('application/json')
                    .code(500);
            }else{
                reply({
                    accountToken: request.auth.credentials.accountToken,
                    streams: account.streams,
                    requestStatus: 'success'
                }).type('application/json')
                    .code(200)
            }

        };

        accountsService.getCurrentAccount(accountId, onAccount);
    },
};

module.exports.create =  {
    description: 'Creates a new stream for a given account',
    auth: 'simple',
    handler: function(request, reply){
        var accountId = request.auth.credentials.id;
        var addToStreamParams = request.payload;

        var addToStreamSchema = Joi.object().keys({
            streamName: Joi.string().min(3).max(120).required()
        })

        debugger;
        var onAddStream = function(err, streamCreateStatus, streamName, event){
            if(err){
                debugger;
                reply({
                    requestStatus: 'failure',
                    error: 'Internal Server Error',
                    errorMessage: err.message
                }).type('application/json')
                    .code(500);
            }else{
                reply({
                    requestStatus: 'success',
                    streamName: streamName,
                }).type('application/json')
                    .code(200);
            }
        }

        Joi.validate(addToStreamParams, addToStreamSchema, function(err, value){
            if(err){
                debugger;
                reply({requestStatus: 'failure',
                       error: 'Bad Request'
                      }).type('application/json')
                        .code(400)
            }else{
                accountsService.addToStream(accountId,
                                            addToStreamParams.streamName,
                                            onAddStream
                                            )
            }
        });

    }


}
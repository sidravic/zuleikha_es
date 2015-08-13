var accountsService = require('./../services/accounts_service.js');
var async           = require('async');
var Joi             = require('joi');
var _               = require('lodash');

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


        var onAddStream = function(err, streamCreateStatus, streamName, event){
            if(err){
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
                var errorMessages = [];
                _.map(err.details, function(error){
                    errorMessages.push(error.message);
                })

                var displayAbleErrorMessage = errorMessages.join(". ");
                reply({requestStatus: 'failure',
                       error: 'Bad Request',
                       errorMessage: displayAbleErrorMessage
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
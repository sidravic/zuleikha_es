var _   = require('lodash');
var Joi = require('joi');
var validateAndPersistPipelineService = require('./../../../../services/validate_and_persist_pipeline_service.js');
var accountService = require('./../services/accounts_service.js');
var HttpEventStreamCatchupService = require('./../../../../services/http_event_stream_catchup_service.js');

var getDisplayableErrorMessages = function(errObject){
    var errorMessages = []

    _.map(errObject.details, function(error){
        errorMessages.push(error.message);
    })

    return (errorMessages.join('. '));
}


module.exports.create = {
    description: "Create a new event on a particular stream",
    auth: 'simple',
    handler: function(request, reply){
        var eventSchema = Joi.object().keys({
            eventAttributes: Joi.object({
                eventType: Joi.string().required()
            }).required()
        });


        var payload = request.payload;

        Joi.validate(payload, eventSchema, {allowUnknown: true,
                                            abortEarly: false},
                                            function(err, validatedResult){
            if(err) {
                var displayableErrorMessage = getDisplayableErrorMessages(err);

                reply({
                    requestStatus: 'failure',
                    error: 'Bad Request',
                    errorMessage: displayableErrorMessage
                }).type('application/json')
                  .code(400)
            }else{
                debugger;
                var accountId = request.auth.credentials.id;
                var streamName = request.params.streamName;
                var eventAttributes = request.payload.eventAttributes;
                var accountEmail = request.auth.credentials.email;

                var onEventAdded = function(err, result){
                    if(err){
                        var error = new Error('Event could not be added to the stream at this point.' +
                            '                  Please try again later');
                        reply({
                            requestStatus: 'failure',
                            error: 'Internal Server Error',
                            errorMessage: error.message
                        }).type('application/json').code(500)
                    }else{
                        reply({
                            requestStatus: 'success',
                            eventDetails: result
                        }).type('application/json').code(200);
                    }
                }

                accountService.streamBelongsToaccount(streamName, accountEmail, function(err, belongsTo){
                    debugger;
                    if(err){
                        var error = new Error('Event could not be added to the stream at this point.' +
                                              ' Please try again later');
                        reply({
                            requestStatus: 'failure',
                            error: 'Internal Server Error',
                            errorMessage: error.message
                        }).type('application/json').code(500)
                    }else {
                        if (belongsTo)
                            validateAndPersistPipelineService.save(accountId, streamName, eventAttributes, onEventAdded);
                        else{
                            reply({
                                requestStatus: 'failure',
                                error: 'Bad Request',
                                errorMessage: 'invalid StreamName'
                            }).type('application/json').code(400);
                        }
                    }

                })

            }
        })
    }
}


module.exports.index = {
    description: 'Returns a paginated list of events',
    auth: 'simple',
    handler: function(request, reply){
        var accountId    = request.auth.credentials.id;
        var accountEmail = request.auth.credentials.email;
        var streamName   = request.params.streamName;

        var catchUpStreamSchema = Joi.object().keys({
            streamName: Joi.string().required(),
            startSequenceId: Joi.number().integer().required(),
            endSequenceId: Joi.number().integer().greater(Joi.ref('startSequenceId')).optional()
        });

        var catchUpStreamParams = {
            streamName: streamName,
            startSequenceId: request.query.startSequenceId,
            endSequenceId: request.query.endSequenceId
        };

        Joi.validate(catchUpStreamParams, catchUpStreamSchema, function(err, result){
            if(err){
                var displayableErrorMessage = getDisplayableErrorMessages(err);

                reply({
                    requestStatus: 'failure',
                    error: 'Bad Request',
                    errorMessage: displayableErrorMessage
                }).type('application/json').code(400);
            }else{
                var startSequenceId = parseInt(request.query.startSequenceId);
                var endSequenceId   = parseInt(request.query.endSequenceId);

                var onResultSet = function(err, resultSet){
                    reply({
                        requestStatus: 'success',
                        resultSet: resultSet.data,
                        next: resultSet.nextUrl,
                        hasMore: resultSet.hasMore,
                        totalEvents: resultSet.totalEvents
                    })

                }
                accountService.streamBelongsToaccount(streamName, accountEmail, function(err, belongsTo){
                    if(err){
                        var error = new Error('Event could not be added to the stream at this point.' +
                            ' Please try again later');
                        reply({
                            requestStatus: 'failure',
                            error: 'Internal Server Error',
                            errorMessage: error.message
                        }).type('application/json').code(500)
                    }else{
                        if(belongsTo){
                            HttpEventStreamCatchupService.fetch(accountId, streamName,
                                                                startSequenceId,
                                                                endSequenceId,
                                                                onResultSet
                            )
                        }else{
                            reply({
                                requestStatus: 'failure',
                                error: 'Bad Request',
                                errorMessage: 'invalid StreamName'
                            }).type('application/json').code(400);
                        }
                    }
                })
            }
        })


    }
}
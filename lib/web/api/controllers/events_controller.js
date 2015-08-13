var _   = require('lodash');
var Joi = require('joi');
var validateAndPersistPipelineService = require('./../../../../services/validate_and_persist_pipeline_service.js');


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
                var errorMessages = [];
                _.map(err.details, function(error){
                    errorMessages.push(error.message);
                })
                var displayableErrorMessage = errorMessages.join(". ");

                reply({
                    requestStatus: 'failure',
                    error: 'Bad Request',
                    errorMessage: displayableErrorMessage
                }).type('application/json')
                  .code(400)
            }else{
                var accountId = request.auth.credentials.id;
                var streamName = request.params.streamName;
                var eventAttributes = request.payload.eventAttributes;

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

                validateAndPersistPipelineService.save(accountId, streamName, eventAttributes, onEventAdded);
            }
        })
    }
}
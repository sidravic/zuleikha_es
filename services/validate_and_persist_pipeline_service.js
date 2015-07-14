var Joi = require('joi');
var event = require('./../models/event.js');
var async = require('async');
var _ = require('lodash');
var EventBuilderService = require('./event_builder_service.js');
var save = require('./../lib/datastores/rethinkdb/persistence.js').save;
var NameGeneratorService = require('./name_generator_service.js');

var eventSchema =  Joi.object().keys({
    accountId: Joi.string().length(36).required(),
    streamName: Joi.string().min(3).max(24).required(),
    eventAttributes: Joi.object().keys({
    }).unknown().required().min(1).max(22).rename('_createdAt', 'created_at')
});




var validateAndPersist = function(accountId, streamName,
                                  eventAttributes, cb){

    async.waterfall([
        function validate(callback){
            var newEvent = {
                accountId: accountId,
                streamName: streamName,
                eventAttributes: eventAttributes
            }

            Joi.validate(newEvent, eventSchema, {abortEarly: false}, callback);
        },

        function buildEvent(validEvent, callback){
            var accountId = validEvent.accountId;
            var streamName = validEvent.streamName;
            var eventAttribtues = validEvent.eventAttributes;

            var onEvent = function(err, event){
                debugger;
                callback(err, event);
            }

            EventBuilderService.buildEvent(accountId, streamName,
                                           eventAttribtues, onEvent)
        },

        function persistEvent(validEvent, callback){
            var onSave = function(err, saveEvent){
                callback(err, saveEvent);
            };

            var tableName = NameGeneratorService.getTableName(validEvent.accountId,
                                                              validEvent.stream);
            save(validEvent, tableName, onSave);
        }


    ], function(err, persistedEvent){
        debugger;
        if(err && (err.name == 'ValidationError'))
            cb(err, persistedEvent);
        else if(err)
            cb(err, {accountId: accountId,
                     stream: streamName});
        else
            cb(null, persistedEvent);
    })


}

var ValidateAndPersistPipelineService = {
    save: function(accountId, streamName, eventAttributes, cb){
        validateAndPersist(accountId, streamName,
                           eventAttributes, function(err, result){
            cb(err, result);
        });
    }
}

module.exports = ValidateAndPersistPipelineService;
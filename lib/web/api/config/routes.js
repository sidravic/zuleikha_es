var Path               = require('path');
var EventsController = require('./../controllers/events_controller.js');
var StreamsController = require('./../controllers/streams_controller.js');
var internals = {};

module.exports = [
    { path: '/v1/streams/{streamName}/events', method: 'POST', config: EventsController.create },
    { path: '/v1/streams', method: 'GET', config: StreamsController.index},
    { path: '/v1/streams', method: 'POST', config: StreamsController.create},
]
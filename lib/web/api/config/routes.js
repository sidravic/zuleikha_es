var Path               = require('path');
var EventsController = require('./../controllers/events_controller.js');
var StreamsController = require('./../controllers/streams_controller.js');
var internals = {};

module.exports = [
    { path: '/api/v1/events', method: 'GET', config: EventsController.index },
    { path: '/api/v1/streams', method: 'GET', config: StreamsController.index}
]
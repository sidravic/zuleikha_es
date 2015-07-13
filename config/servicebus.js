var environment    = ((process.env.NODE_ENV == undefined) || (process.env.NODE_ENV == 'REPL')) ?
    'development' : process.env.NODE_ENV;
var databaseConfig = require('./database_config.js')[environment];
var rabbitMQUrl = databaseConfig.rabbitmq_url



var bus = require('servicebus').bus({url: rabbitMQUrl,
                                     enableConfirm: true});
bus.use(bus.package());
bus.use(bus.correlate());
bus.use(bus.retry());

module.exports = bus;
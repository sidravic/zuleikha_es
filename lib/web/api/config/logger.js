var Bucker = require('bucker')

var Logger = Bucker.createLogger({
    app: 'log/application.log',
    level: 'debug',
    console: {
        color: true,
        timestamp: 'MM/DD/YYYY HH:mm:ss',
    },
    timestamp: 'MM/DD/YYYY HH:mm:ss SSS',
    accessFormat: ':time :level :method :status :url'
})


module.exports = Logger;
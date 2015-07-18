var config = {
    development: {
        replicaCount: 1,
        rabbitmq_url: 'amqp://client:client@localhost:5672',
        store: 'rethinkdb',
        servers: [
            {host: '127.0.0.1', port: 28015, proxy: true},
            {host: '127.0.0.1', port: 28016, proxy: false},
            {host: '127.0.0.1', port: 28018, proxy: false},
        ],
        databaseName: 'event_store_development'
    },

    staging: {
        replicaCount: 2,
        servers: [],
        databaseName: ''
    },

    production: {
        replicaCount: 2,
        servers: []
    }

};

module.exports = config;
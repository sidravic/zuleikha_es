var config = {
    development: {
        servers: [
            {host: '127.0.0.1', porT: 28015, proxy: false },
            {host: '127.0.0.1', port: 28016, proxy: false},
            {host: '127.0.0.1', port: 28017, proxy: true}
        ],
        databaseName: 'event_store_development'
    },

    staging: {
        servers: [],
        databaseName: ''
    },

    production: {
        servers: []
    }

};

module.exports = config;
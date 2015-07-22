var Routes = require('./config/routes');
var logger = require('./config/logger.js');
var Path   = require('path');
var Ejs    = require('ejs');
var util   = require('util');

console.log(Path.join(__dirname, 'views'));


exports.register = function(server, options, next){
    server.route(Routes);

    server.views({
        engines: {
            html: Ejs
        },
        path: Path.join(__dirname, 'views'),
        partialsPath: Path.join(__dirname, 'views'),
        layoutPath: Path.join(__dirname, 'views/layouts'),
        layout: 'application'
    });


    server.ext('onPreHandler', function(req, reply){
        logger.info(['request'],  req.method.toString().toUpperCase() +
                                  " " + req.path.toString() +
                                  " query_params:" + util.inspect(req.params) +
                                  " payload:" + util.inspect(req.payload))
        return reply.continue();
    })


    server.ext('onPreResponse', function(req, reply){
        if(req.response.isBoom)
            process.nextTick(function(){
                logger.error(['error'], {error_message: req.response.message,
                    headers: req.response.out.headers,
                    statusCode: req.response.out.statusCode,
                    payload: req.response.out.payload
                })
            })

        return reply.continue();
    })

    next()
};

exports.register.attributes = {
    pkg: require('./../../../package.json')
}

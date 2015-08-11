var Routes = require('./config/routes');
var logger = require('./config/logger.js');
var Path   = require('path');
var util   = require('util');
var _      = require('lodash');

console.log(Path.join(__dirname, 'views'));


exports.register = function(server, options, next){

    server.register(require('hapi-auth-cookie'), function(err){
        server.auth.strategy('session', 'cookie', {
            password: 'piperatthegatesofdawniscallingyouhisway',
            redirectTo: '/',
            isSecure: false,
            cookie: '_zuleikha_es'
        })
    });

    server.route(Routes);

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
                //logger.error(['error'], {error_message: req.response.message,
                //    statusCode: req.response.out.statusCode,
                //    payload: req.response.out.payload
                //})
            })

        return reply.continue();
    })

    next()
};

exports.register.attributes = {
    pkg: require('./../../../package.json')
}

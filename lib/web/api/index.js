var Routes = require('./config/routes');
var Logger = require('./config/logger.js');
var Path   = require('path');
var util   = require('util');
var _      = require('lodash');
var authenticationService = require('./services/authentication_service.js');

console.log(Path.join(__dirname, 'views'));


exports.register = function(server, options, next){
    server.register(require('hapi-auth-bearer-token'), function(err){

        server.auth.strategy('simple', 'bearer-access-token', {
            allowQueryToken: true,
            allowMultipleHeaders: true,
            accessTokenName: 'AccessToken',
            validateFunc: authenticationService.authenticate
        })
    });

    server.ext('onPreHandler', function(req, reply){
        Logger.info(['request'],  req.method.toString().toUpperCase() +
            " " + req.path.toString() +
            " query_params:" + util.inspect(req.params) +
            " payload:" + util.inspect(req.payload))
        return reply.continue();
    })


    server.ext('onPreResponse', function(req, reply){
        if(req.response.isBoom)
            process.nextTick(function(){
                console.log(req.response);
                debugger;
                //logger.error(['error'], {error_message: req.response.message,
                //    statusCode: req.response.out.statusCode,
                //    payload: req.response.out.payload
                //})
            })

        return reply.continue();
    })



    server.route(Routes);


    next()
};

exports.register.attributes = {
    name: 'WebAPI',
    version: '1.0'
}

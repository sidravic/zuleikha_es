var Routes = require('./config/routes');
var logger = require('./config/logger.js');
var Path   = require('path');
var Ejs    = require('ejs');
var util   = require('util');
var _      = require('lodash');

console.log(Path.join(__dirname, 'views'));


exports.register = function(server, options, next){
    var crumbOptions = {
        skip: function(request, reply){

            var authorization = request.headers.authorization;

            if(_.isEmpty(authorization)){
                return false;
            }else{
                var isBearer = _.contains(authorization, 'Bearer ');

                if (isBearer)
                    return true;
                else
                    return false;
            }



        }
    }

    server.register({register: require('crumb'), options: crumbOptions}, function(err){
        if(err)
            throw err;
    })

    server.register(require('hapi-auth-cookie'), function(err){
        server.auth.strategy('session', 'cookie', {
            password: 'piperatthegatesofdawniscallingyouhisway',
            redirectTo: '/',
            isSecure: false,
            cookie: '_zuleikha_es'
        })
    });

    server.route(Routes);

    server.views({
        engines: {
            html: Ejs
        },
        path: Path.join(__dirname, 'views'),
        partialsPath: Path.join(__dirname, 'views'),
        layoutPath: Path.join(__dirname, 'views/layouts'),
        layout: 'application',
        context: { lodash: _ }
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

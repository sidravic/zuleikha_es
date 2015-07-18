var Routes = require('./config/routes');
var Path   = require('path');
var Ejs    = require('ejs');

console.log(Path.join(__dirname, 'views'));
debugger;

exports.register = function(server, options, next){
    server.route(Routes);

    server.views({
        engines: {
            html: Ejs
        },
        path: Path.join(__dirname, 'views'),
        layoutPath: Path.join(__dirname, 'views/layouts'),
        layout: 'application'
    });

    next()
};

exports.register.attributes = {
    pkg: require('./../../../package.json')
}

var Path               = require('path');
var AccountsController = require('./../controllers/accounts_controller.js');
var internals = {};
var staticHandler = {
    javascripts: {
        handler: {
            directory: {
                path: Path.join(__dirname, './../assets/javascripts')
            }
        }
    },
    css: {
        handler: {
            directory: {
                path: Path.join(__dirname, './../assets/css')
            }
        }
    }
};

internals.staticHandler = staticHandler;
module.exports = [
    { path: '/', method: 'GET', config: AccountsController.index },
    { path: '/signup', method: 'GET', config: AccountsController.new},
    { path: '/accounts', method: 'POST', config: AccountsController.create},
    { path: '/login', method: 'POST', config: AccountsController.login},
    { path: '/logout', method: 'GET', config: AccountsController.destroy},
    { path: '/accounts/{id}', method: 'GET', config: AccountsController.show},
    { path: '/assets/javascripts/{filename}', method: 'GET', config: internals.staticHandler.javascripts},
    { path: '/assets/css/{filename}', method: 'GET', config: internals.staticHandler.css}
]
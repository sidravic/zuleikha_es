var crypto = require('crypto');

var AccountTokenGeneratorService = {
    generateSync: function(){
        var token = crypto.randomBytes(32);
        var time  = Date.now().toString();
        var accountToken = crypto.createHash('sha1').update(token + time).digest('hex');
        return accountToken;
    }


};

module.exports = AccountTokenGeneratorService;
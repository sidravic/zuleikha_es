var Hoek = require('hoek');

var Account = function(accountParams){
    this.id;
    this.email;
    this.password;
    this.passwordConfirmation;
    this.encryptedPassword;
    this.privateKey;
    this.accountToken;

    if(!accountParams)
        accountParams = {};
    else{
        this.email = accountParams.email;
        this.password = accountParams.password;
        this.passwordConfirmation = accountParams.password_confirmation || accountParams.passwordConfirmation;
    }

}

Account.prototype.attributes = function(){
    var attrs = {
        id: this.id,
        email: this.email,
        encryptedPassword: this.encryptedPassword,
        privateKey: this.privateKey,
        accountToken: this.accountToken,
        salt: this.salt

    };

    if(this.password)
        Hoek.merge(attrs, {password: this.password})

    if(this.passwordConfirmation)
        Hoek.merge(attrs, {passwordConfirmation: this.passwordConfirmation});


    return attrs;
}

module.exports = Account;
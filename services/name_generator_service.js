var NameGeneratorService = {
    getTableName: function(accountId, streamName){
        var aphlanumAccountId = accountId.toString().replace(/-/g, '');
        return aphlanumAccountId + "_" + streamName;
    },


    getQueueName: function(accountId, streamName){
        var alphanumAccountId = accountId.toString().replace(/-/g, '');
        return alphanumAccountId + "." + streamName;
    }
};


module.exports = NameGeneratorService
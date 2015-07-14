var NameGeneratorService = {
    getTableName: function(accountId, streamName){
        var aphlanumAccountId = accountId.toString().replace(/-/g, '');
        return aphlanumAccountId + "_" + streamName;
    },


    getQueueName: function(accountId, streamName){
        var aphlanumAccountId = accountId.toString().replace(/-/g, '');
        return aphlanumAccountId + "." + streamName;
    }


};


module.exports = NameGeneratorService
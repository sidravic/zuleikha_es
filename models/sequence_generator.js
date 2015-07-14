var db = require('./../lib/datastores/rethinkdb/init.js');
var r = db.r;
var exec = db.exec;
var constants = require('./../config/constants.js');
var SequenceGenerator = {
    // tableName formed by
    // accountId + '_' + tableName;
    nextSeq: function(tableName, callback){
        exec(function(conn){
            conn.use(db.databaseName);

            r.table(constants.eventSeqTableName)
                .get(tableName)
                .update({sequence_number: r.row('sequence_number').add(1),
                         _updatedAt: new Date()
                        },
                        {durability: 'hard', returnChanges: true})
                .run(conn, function(err, result){
                    if(result.skipped == 1)
                        callback(new Error('Record Not Found'), null)
                    else
                        callback(null, result.changes[0].new_val.sequence_number);
                })
        })
    }
}

module.exports = SequenceGenerator;
var db                   = require('./../lib/datastores/rethinkdb/init.js');
var r                    = db.r;
var nameGeneratorService = require('./name_generator_service.js');
var constants            = require('./../config/constants.js');
var exec                 = db.exec;
var async                = require('async');

var HttpEventStreamCatchUpService = {
    fetch: function(accountId, streamName, startSequenceId, endSequenceId, cb){
        var self                     = this;
        var tableName                = nameGeneratorService.getTableName(accountId, streamName);
        var paginateCount            = 10;
        var paginatedStartSequenceId = startSequenceId;
        var paginatedEndSequenceId   = startSequenceId + paginateCount;
        var hasMore                  = false;

        if (paginatedEndSequenceId < endSequenceId) {
            hasMore = true;
        }else{
            paginatedEndSequenceId = endSequenceId;
        }


        async.parallel({
            findResultSet: function(callback){
                exec(function(conn){
                    conn.use(db.databaseName);

                    r.table(tableName)
                        .between(paginatedStartSequenceId, paginatedEndSequenceId, {index: 'sequence_id',
                                                                                    rightBound: 'closed'
                                                                                   })
                        .orderBy('sequence_id')
                        .run(conn, function(err, resultSet){
                            if(err)
                                callback(err, resultSet);
                            else
                                callback(null, resultSet);
                        })
                })
            },

            totalEventsRemainingTillEndSequenceId: function(callback){
                var totalEventsTillEndSequenceId = 0;

                if(hasMore){
                    totalEventsTillEndSequenceId = endSequenceId - paginatedEndSequenceId;
                }
                callback(null, totalEventsTillEndSequenceId);
            },

            totalEventsRemaining: function(callback){
                exec(function(conn){
                    r.table(tableName)
                        .between(paginatedEndSequenceId, r.maxval, {index: 'sequence_id',
                            rightBound: 'closed'})
                        .orderBy('sequenceId')
                        .count()
                        .run(conn, function(err, count){
                            if(err)
                                callback(err, count);
                            else
                                callback(null, count);
                        })
                });
            },
        },function(err, result){
            if(err)
                cb(err, null);
            else{
                debugger;
                var nextStartSeqId = null;
                var nextEndSeqId   = null;
                var eventsRemaining = result.totalEventsRemainingTillEndSequenceId;

                if(result.totalEventsRemaining < result.totalEventsRemainingTillEndSequenceId)
                    eventsRemaining = result.totalEventsRemaining;

                if(eventsRemaining > 0){
                    nextStartSeqId = paginatedEndSequenceId + 1;
                    nextEndSeqId   = paginatedEndSequenceId + eventsRemaining;
                };

                var response = {
                    data: {
                        nextStartSeqId: nextStartSeqId,
                        nextEndSeqId: nextEndSeqId,
                        resultSet: result.findResultSet
                    },
                    hasMore: hasMore,
                    totalEventsRemaining: result.totalEventsRemainingTillEndSequenceId,
                    totalEventsRemainingInStream: result.totalEventsRemaining,
                    nextUrl: '/v1/streams/' + streamName + '/events?startSequenceId=' + nextStartSeqId +
                             '&endSequenceId=' + nextEndSeqId

                }

                cb(null, response);

            }

        })




    },


};

module.exports = HttpEventStreamCatchUpService;
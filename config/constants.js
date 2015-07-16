var Constants = {
    eventsTableName: 'events',
    eventSeqTableName: 'event_sequences',
    accountsTableName: 'accounts',
    streamsTableName: 'event_streams',
    eventsAttributeStream: 'stream_name',
    Commands: {
        createNewStreamRequested: 'createNewStreamRequest',
        newEvent: 'newEvent',
        subscribeEvent: 'subscribeEvent',
        unsubscribeEvent: 'unsubscribeEvent',
        subscribeCatchupStreamEvent: 'subscribeCatchupStreamEvent',
        unsubscribeCatchupStreamEvent: 'unsubscribeCatchupStreamEvent'
    },
    childProcess: {
        events: {
            subscribe: 'subscribe',
            unsubscribe: 'unsubscribe',
            subscribeCatchupStreamEvent: 'subscribeCatchupStreamEvent'
        }
    }
}

module.exports = Constants;
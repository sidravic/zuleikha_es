var Constants = {
    eventsTableName: 'events',
    eventSeqTableName: 'event_sequences',
    accountsTableName: 'accounts',
    streamsTableName: 'event_streams',
    eventsAttributeStream: 'stream_name',
    Commands: {
        createNewStreamRequested: 'createNewStreamRequest',
        newEvent: 'newEvent'
    },
    childProcess: {
        events: {
            subscribe: 'subscribe',
            unsubscribe: 'unsubscribe'
        }
    }
}

module.exports = Constants;
var Constants = {
    eventsTableName: 'events',
    eventSeqTableName: 'event_sequences',
    accountsTableName: 'accounts',
    streamsTableName: 'event_streams',
    eventsAttributeStream: 'stream_name',
    Commands: {
        createNewStreamRequested: 'createNewStreamRequest',
        newEvent: 'newEvent'
    }
}

module.exports = Constants;
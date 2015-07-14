### Event Store

Backed by RethinkDb as a datastore that publishes events to a Rabbitmq message bus.

# Subscribe stream

Currently has a subscribe stream that publishes events to a message bus with the queue
name `notify.<stream-name>`

# Issue

~~However, the stream crashes out because of excessive fiber creation. Migrating away from Fibers altogether~~
Fibers issues have been resolved. No more fibers used. 

# Progress

1. Creating a new stream - Done
2. Getting asynchronously notified when new stream is created - Done
3. Account based streams. Allowing multiple users to create streams. - Done
4. Streams to be linked to account Ids - Done
5. Adding events to streams - in progress
6. Subscription to stream events in realtime - in progress
7. Catchup streams - Pending
8. HTTP based interface - Pending
9. Adminstrative interface. - Pending








### Event Store

Backed by RethinkDb as a datastore that publishes events to a Rabbitmq message bus.

# Subscribe stream

Currently has a subscribe stream that publishes events to a message bus with the queue
name `notify.<stream-name>`

# Issue

~~However, the stream crashes out because of excessive fiber creation. Migrating away from Fibers altogether~~
Fibers issues have been resolved.

# Progress

1. Creating a new stream - Done
2. Getting asynchronously notified when new stream is created - Done
3. Account based streams. Allowing multiple users to create streams. - Done
4. Streams to be linked to account Ids - Done
5. Adding events to streams - Done
6. Subscription to stream events in realtime - Done
7. Catchup streams - Done
8. HTTP based interface - In Progress
9. Adminstrative interface. - Pending
10. Client libraries - Pending.
11. Docs and How to integrate. - Pending








### Event Store

Backed by RethinkDb as a datastore that publishes events to a Rabbitmq message bus.

# Subscribe stream

Currently has a subscribe stream that publishes events to a message bus with the queue
name `notify.<stream-name>`

# Issue
However, the stream crashes out because of excessive fiber creation. Migrating away from Fibers altogether.




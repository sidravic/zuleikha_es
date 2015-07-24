### Zuleikha - Event Store

Backed by RethinkDb as a datastore that publishes events to a Rabbitmq message bus. It's a fairly ghetto implementation and untested.

# Issues

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
12. 


# Usage

Zuleikha assumes you're running an instance of RabbitMQ and RethinkDb. 

1. Open `config/database_config.js` and update URLs for your RabbitMQ and RethinkDb servers.
2. launch your application by running `node app.js`. 
3. Accessing `http://localhost:4005` should show you a crappy login screen.
4. Hit the signup url and create and account.
5. Once you have an account the app redirects you to a dashboard page which contains your `account_id`.
6. Save the `account_id` in the app that'll be using the Zuleikha Eventstore


# Creating a new stream

A stream is uniquely identified by a `streamName`. A stream accepts Events of a specific type. We'll call ours `transactions`
In the next few steps we'll send a request to the Zuleikha Event store to create a new stream and check if the stream creation process was successful. We'll be doing this with `Node.js` and the `serviceBus` library. However, you could work with any AMQP library to achieve this.

Remember all queues are transient. They aren't persisted. The reason is you can catchup on a stream when needed and it would make sense to persist it elsehwere.

```
//Initialize our Bus.
var servicebus = require('servicebus').bus();

// Adding a few additional features here. Not directly related to the event store though.
servicebus.use(servicebus.package());
servicebus.use(servicebus.correlate());
servicebus.use(servicebus.retry());

//Create a standard server.
var net = require('net');
var server =  net.createServer()
server.listen(5001, function(){
    console.log('Connection established');
    
    //========================================================================
    // Create a stream;
    //========================================================================
    var streamName = "my_test_stream";
    var accountId  = "b98711eb-d305-4b45-adbb-c4f7ff59abe6"

    // We need to listen on a queue to know the status of our requests. 
    var alphanumAccountId = accountId.toString().replace(/-/g, '')
    var queueName         = alphanumAccountId + "." + streamName + ".responses";
    
    // Our queue would look like this. Notice we squashed the "hyphens".
    // "b98711ebd3054b45adbbc4f7ff59abe6.my_test_stream.responses"

    // Imp. Don't make persistent queues. The goal here is to persist it outside
    // this interaction layer. 
    // You may persist this elsewhere
    
    console.log(queueName);
    // Here we subscribe to the channel that provides us feedback of all our requests to the eventstore.
    servicebus.subscribe(queueName, function(data){
        console.log(data);
    })

    // Now lets sent it commands to create a new Stream. 
    // The command name for this "createNewStreamRequest"
    
    servicebus.publish("eventstore.commands", {
        accountId: accountId,
        streamName: streamName,
        command: 'createNewStreamRequest'
    });
    
    // You're done. You're stream would show up. In your accounts and on the RethinkDb admin insterface

    //========================================================================
    //  Adding events to the system
    //========================================================================

    // The command name for adding events to the event store is "newEvent".
     var i = 0 ;
     ++i;

    setInterval(function(){
        console.log("Publishing...");
        servicebus.publish('eventstore.commands', {
            command: 'newEvent',
            accountId: accountId,
            streamName: 'my_test_stream',
            eventAttributes: {
                timestamp: new Date(),
                number: 1
            }
        });
    }, 3000)
})
````

# Subscribing to a stream. 

There is significant benefits in listening on a stream in realtime. The events are propogated directly to the processor application. The processor application could be anything that works on these events. 

```
  //========================================================================
  // Subscribing to an event stream
  //========================================================================
  // First Define the callback you're going to listen to events arriving from
  // your stream.
  var subscriptionQueueName = alphanumAccountId + "." + streamName;
  console.log(subscriptionQueueName);

  servicebus.subscribe(subscriptionQueueName, function(event){
    console.log('----');
    console.log(event)
    console.log('----');
  })

  // Send out the command to subscribe to a stream.
  servicebus.publish('eventstore.commands', {
      accountId: accountId,
      streamName: streamName,
      command: 'subscribeEvent'
  })
  ```
  The code is fairly onerous in expecting the API user to trigger both endpoints however this could be simplified     when building clients.  
  
  The events returned by the server look like this.
  
  ```
  { data:
   { _createdAt: '2015-07-24T11:13:24.794Z',
     accountId: 'b98711eb-d305-4b45-adbb-c4f7ff59abe6',
     number: 1,
     sequence_id: 12,
     stream: 'my_test_stream',
     timestamp: '2015-07-24T11:13:24.456Z' },
  datetime: 'Fri, 24 Jul 2015 11:13:24 GMT',
  type: 'b98711ebd3054b45adbbc4f7ff59abe6.my_test_stream',
  cid: '6be0599e-7514-4bb5-bb0e-17041750fec6' }
  ```
  
  
# Catching up to a stream  

Catching up to a stream works very similiarly to the `subscribeStreamEvent`. 
We indicate to the event store that we're interested in catchingup to the stream specified by "streamName", the `startSequenceId` and the `endSequenceId` defines the range of events we want relayed back to us.

We'll use the same listener/subscriber to get the events from the event store.

```
//========================================================================
// Catching up to a stream
//========================================================================

  var subscriptionQueueName = alphanumAccountId + "." + streamName;
  console.log(subscriptionQueueName);

  servicebus.subscribe(subscriptionQueueName, function(event){
    console.log('----');
    console.log(event)
    console.log('----');
  })

servicebus.publish('eventstore.commands', {
        accountId: accountId,
        streamName: streamName,
        startSequenceId: 5,
        endSequenceId: 10,
        command: 'subscribeCatchupStreamEvent'
    })
```    
    
The stream ends with the a `data` attribute that reads `streamEnded`
```
  ----
  { data:
     { _createdAt: '2015-07-24T11:31:12.126Z',
       accountId: 'b98711eb-d305-4b45-adbb-c4f7ff59abe6',
       name: { first_name: 'Siddharth', lastname: 'Ravichandran' },
       number: 1,
       sequence_id: 18,
       stream: 'my_test_stream',
       timestamp: '2015-07-24T11:31:11.549Z' },
    datetime: 'Fri, 24 Jul 2015 11:37:00 GMT',
    type: 'b98711ebd3054b45adbbc4f7ff59abe6.my_test_stream',
    cid: 'dbffe47c-8f83-447d-86ed-d3b186d40c77' }
  ----
  ----
  { data: 'streamEnded',
    datetime: 'Fri, 24 Jul 2015 11:37:00 GMT',
    type: 'b98711ebd3054b45adbbc4f7ff59abe6.my_test_stream',
    cid: '1751c219-1d62-41ff-bd9f-f9f3f8ef8c1f' }
  ----

```

Unlike Catchup streams, subscription streams need to be manually closed. To close a subscription stream send out an `unSubscribeEvent`

```
servicebus.publish('eventstore.commands', {
    accountId: accountId,
    streamName: streamName,
    command: 'unSubscribeEvent'
  })
```
  
















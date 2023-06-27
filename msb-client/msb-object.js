'use strict';
module.exports = function(RED) {
  function MsbApp(config) {

    var MsbClient = require('@vfk_research/msb-client-websocket-nodejs');

    RED.nodes.createNode(this, config);

    // setup msb client
    var myMsbClient = new MsbClient(config.serviceType, config.uuid, config.name, config.description, config.token);
    var flowContext = this.context().flow;

    this.eventList = config.eventList || [];
    this.functionList = config.functionList || [];
    this.configList = config.configList || [];

    // add all config parameters and events to flow context to be accessed by msb-config and msb-event nodes
    flowContext.set('configList', this.configList);
    flowContext.set('eventList', this.eventList);
    flowContext.set('myMsbClient', this.myMsbClient);

    var node = this;

    node.on('close', function(done) {
      if (myMsbClient.isConnected() || myMsbClient.isRegistered()) {
        myMsbClient.disconnect();
      }
      myMsbClient.disableAutoReconnect(true);
      done();
    });

    // add a status label to the msb-object node to indicate its connection state with msb
    myMsbClient.getConnectionStateListener().on('connectionState', function(msg) {
      if (msg === 'NIO_ALREADY_CONNECTED' || msg === 'NIO_UNAUTHORIZED_CONNECTION') {
        node.status({fill: 'red', shape: 'ring', text: 'connection error'});
      } else if (msg === 'CLOSED_AND_RECONNECT') {
        node.status({fill: 'yellow', shape: 'ring', text: 'reconnecting'});
      } else if (msg === 'IO_CONNECTED') {
        node.status({fill: 'green', shape: 'dot', text: 'connected'});
      } else if (msg === 'NEW_PARAMETERS') {
        node.configList.forEach(function(value, index, array) {
          node.configList[index].configValue = myMsbClient.getConfigParameter(value.name);
        });
      }
    });

    // create an api endpoint to get all msb events of a deployed msb-object via the flowContext
    RED.httpAdmin.get('/msbevents', RED.auth.needsPermission('msb.read'), function(req, res) {
      res.json(flowContext.get('eventList'));
    });

    // create an api endpoint to get all msb config parameters of a deployed msb-object via the flowContext
    RED.httpAdmin.get('/msbconfigs', RED.auth.needsPermission('msb.read'), function(req, res) {
      res.json(flowContext.get('configList'));
    });

    var msb_url = config.url || null;

    // enable debug log messages (default = false).
    if (config.msbDebugLogging  === true){
      myMsbClient.enableDebug(true);
      node.log("enable debugging")
    }

    // enable data format and message data validation. Might impact performance (default = false).
    myMsbClient.enableDataFormatValidation(true);

    // enable event message cache which stores messages in case of a connection loss (default = true).
    if (config.msbEventCache === false){
      myMsbClient.disableEventCache(true);
      node.log("disable event cache")
    } else {
      myMsbClient.disableEventCache(false);
      node.log("enable event cache")
    }

    // set event cache size (default = 1000 message events).
    if (config.msbEventCacheSize && !isNaN(config.msbEventCacheSize)){
      var numberOfEvents = parseInt(config.msbEventCacheSize, 10)
      myMsbClient.setEventCacheSize(numberOfEvents);
      node.log("set event cache size")
    }

    // enable or disable auto reconnect for the client (default = false).
    if (config.msbAutoReconnect  === false){
      myMsbClient.disableAutoReconnect(true);
      node.log("disable reconnect")
    } else {
      myMsbClient.disableAutoReconnect(false);
      node.log("enable reconnect")
    }

    // set the reconnect interval time (default = 10000 ms).
    myMsbClient.setReconnectInterval(3000);

    // disables hostname verification for ssl (default = false).
    myMsbClient.disableHostnameVerification(true);

    // add new configuration parameters like this.
    // configuration parameters are published to the MSB and can be changed from the MSB GUI in real time.
    node.configList.forEach(function(value) {
      myMsbClient.addConfigParameter(value.name, value.configValue, value.dataTypeName);
    });

    // type dictionary to complete the data format definitions
    var typeDictionary = {};
    typeDictionary.boolean = 'boolean';
    typeDictionary.int32 = 'integer';
    typeDictionary.int64 = 'integer';
    typeDictionary.float = 'number';
    typeDictionary.double = 'number';
    typeDictionary['date-time'] = 'string';
    typeDictionary.byte = 'string';
    typeDictionary.string = 'string';

    node.eventList.forEach(function(value) {
      // prepare the data format required by msb self-description
      var dataFormat;
      if (value.dataTypeName === 'object') {
        dataFormat = JSON.parse(value.schema);
      } else {
        dataFormat = {
          dataObject: {
            type: typeDictionary[value.dataTypeName],
            format: value.dataTypeName,
          },
        };
      }
      // add event to msb client
      myMsbClient.addEvent({
        eventId: value.name.toUpperCase(),
        name: value.name,
        description: value.description,
        dataFormat: dataFormat,
        implementation: {
          priority: 'LOW',
        },
      });
    });

    try {
      node.functionList.forEach(function(value) {
        // prepare the data format required by msb self-description
        var dataFormat;
        if (value.dataTypeName === 'object') {
          dataFormat = JSON.parse(value.schema);
        } else {
          dataFormat = {
            dataObject: {
              type: typeDictionary[value.dataTypeName],
              format: value.dataTypeName,
            },
          };
        }
        var responseEvents = [];
        // check for response events
        if(value.responseEvents){
          responseEvents = JSON.parse(value.responseEvents);
        }
        // add function to msb client
        myMsbClient.addFunction({
          functionId: value.name.toUpperCase(),
          name: value.name,
          description: value.description,
          dataFormat: dataFormat,
          implementation: function(msb_msg) {
            var msg_array = [];
            if (msb_msg === undefined){
              msb_msg = {}
            }
            var new_msg = {
              payload: msb_msg.dataObject,
              msb_msg: msb_msg,
            };
            // set the output index for the message array for node.send
            var index = parseInt(value.output, 10) + 1;
            msg_array[parseInt(index, 10)] = new_msg;
            // remove all previous outputs (handled by other functions)
            for (index; index > 0; index--) {
              msg_array[index - 1] = null;
            }
            node.log('function ' + value.name.toUpperCase() + ' (node output index ' + value.output + ') called, ' +
                'message: ' + msb_msg.dataObject);
            node.send(msg_array);
          },
          responseEvents: responseEvents,
        });
      });
    } catch (err) {
      node.error('something went wrong: ' + err.message);
    }

    // print the msb self-description
    node.log(JSON.stringify(myMsbClient.getSelfDescription(), null, 4));

    // connect to the MSB websocket interface, if you call the .connect function without any parameters,
    if (msb_url !== undefined) {
      myMsbClient.connect(msb_url);

      // register client on MSB
      myMsbClient.register();
    } else {
      node.warn('MSB URL is not set!');
    }

    // each time a message is received
    node.on('input', function(msg) {
      // check event id of the message and publish the msb event
      if (msg.hasOwnProperty('event')) {
        try {
          var payload;
          if (typeof msg.payload === 'object' ||
						typeof msg.payload === 'boolean' ||
						typeof msg.payload === 'number'
          ){
            // send with current format
            payload = msg.payload;
          } else {
            // send as string
            payload = msg.payload.toString();
          }
          myMsbClient.publish({
            eventId: msg.event.toUpperCase(),
            value: payload,
            priority: 0,
            cahced: undefined,
            postDate: undefined,
            correlationId: msg.correlationId
          });
        } catch (event_failure) {
          node.warn('Could not publish event - maybe no such event?' + event_failure);
        }
      }
      // also forward message to std out
      node.send(msg);
    });
  }

  RED.nodes.registerType('msb-object', MsbApp);

};

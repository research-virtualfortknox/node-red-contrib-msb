'use strict';
module.exports = function(RED) {
  function MsbEventNode(config) {

    RED.nodes.createNode(this, config);
    var node = this;

    node.on('input', function(msg) {
      // on each input call, append the event id to the message and output the message
      msg.event = config.event;
      // check correlation strategy
      if(config.correlationStrategy === "New"){
        msg.correlationId = Math.random().toString(16).slice(2);
      } else if (config.correlationStrategy === "Existing"){
        if(msg.msb_msg !== undefined && msg.msb_msg.correlationId !== undefined){
          msg.correlationId = msg.msb_msg.correlationId;
        } else {
          node.warn('No existing correlation id found (msg.msb_msg.correlationId) to be used for event ' + msg.event);
        }
      }
      node.send(msg);
    });
  }

  RED.nodes.registerType('msb-event', MsbEventNode);
};

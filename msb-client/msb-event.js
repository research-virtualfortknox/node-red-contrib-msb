'use strict';
module.exports = function(RED) {
  function MsbEventNode(config) {

    RED.nodes.createNode(this, config);
    var node = this;

    node.on('input', function(msg) {
      // on each input call, append the event id to the message and output the message
      msg.event = config.event;
      node.send(msg);
    });
  }

  RED.nodes.registerType('msb-event', MsbEventNode);
};

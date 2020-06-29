'use strict';
module.exports = function(RED) {
  function MsbConfigParamNode(config) {

    RED.nodes.createNode(this, config);
    var node = this;

    node.on('input', function(msg) {
      // use flow context to get all msb config parameters of a deployed msb-object
      var flowContext = this.context().flow;
      msg.configParam = config.configParam;
      var configList = flowContext.get('configList');

      // on each input call, get and output the current config parameter value
      configList.forEach(function(value, index, array) {
        if (msg.configParam === value.name) {
          msg.payload = configList[index].configValue;
          node.send(msg);
        }
      });
    });
  }

  RED.nodes.registerType('msb-config', MsbConfigParamNode);
};

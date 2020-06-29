<p align="center">
  <a href="https://research.virtualfortknox.de" target="_blank" rel="noopener noreferrer">
    <img src="https://research.virtualfortknox.de/static/cms/img/vfk_research_logo.png" alt="VFK Research Logo" height="70" >
  </a>
</p>

# MSB integration in node-RED flows

[![Build Status](https://travis-ci.org/research-virtualfortknox/node-red-contrib-msb.svg?branch=master)](https://travis-ci.org/research-virtualfortknox/node-red-contrib-msb)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fresearch-virtualfortknox%2Fnode-red-contrib-msb.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fresearch-virtualfortknox%2Fnode-red-contrib-msb?ref=badge_shield)

**Compatibility Matrix**

Version compatibility to MSB versions:

| | **1.5.x-RELEASE** |
|---|:---:|
| 1.0.x       | x |

## Welcome

If you want to contribute, please read the [Contribution Guidelines](.github/CONTRIBUTING.md).

If you want to know how to use this integration in your own node-RED flows, read below.

## What is VFK MSB

TODO: Link to general documentation about VFK MSB

You can use this integration to connect a node-RED flow to VFK MSB.

## Install package to node-RED

Install npm package to your node-RED instance:

```sh
npm install @vfk_research/node-red-contrib-msb
```

or add the ``node-red-contrib-msb`` package via the node-RED package manager.

## Available nodes

Available nodes:
- __msb-object node__: Main node to set up the self-description and connection to MSB
- __msb-event node__: Node to link messages to an MSB event (always wire its output to the msb-object node)
- __msb-config node__: Node to get the current value of a MSB configuration parameter

## Sample flow

You can use [this sample flow](doc/flows/sample-flow.json) to test the capabilities of the nodes:

![Sample node-RED flow](doc/images/sample-node-red-flow.png)

To connect the flow to an MSB instance and test it, some steps need to be done:
1. Update following field in the __msb-object node__:
    - ``UUID``: You can create UUIDs using this [Online Generator](https://www.uuidgenerator.net/version4).
    - ``Token``: Choose your token to be used in MSB verification later
    - ``MSB-URL``: Set the URL to your MSB instance (websocket interface)
2. __Deploy__ the flow - this will establish the connection to MSB
3. __Verify__ your node app in MSB GUI
4. Now you are ready to __test messages__ from the node app to MSB (use the inject-nodes)
5. Optional: if you also want to test incoming messages from MSB to the node app, 
you can __add an integration flow__ in MSB GUI linking hte node app events to its functions (just for testing) e.g.
![Sample node-RED flow](doc/images/sample-msb-flow.png)

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fresearch-virtualfortknox%2Fnode-red-contrib-msb.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fresearch-virtualfortknox%2Fnode-red-contrib-msb?ref=badge_large)

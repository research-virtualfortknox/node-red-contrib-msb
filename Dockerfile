FROM nodered/node-red
MAINTAINER Daniel Schel (daniel.schel@ipa.fraunhofer.de)

USER root

COPY . /opt/node-red-contrib-msb-master
RUN npm install /opt/node-red-contrib-msb-master
#RUN rm -r /opt/node-red-contrib-msb-master

USER node-red

ENTRYPOINT ["npm", "start", "--", "--userDir", "/data"]

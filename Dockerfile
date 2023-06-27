FROM nodered/node-red:3.0.2

# use environment vars to set 
# - proxy configuration
ENV FLOW_FILE_PATH=/data/flows.json \
    FLOW_CRED_FILE_PATH=/data/flows_cred.json
    #HTTP_PROXY=http://prox.corp.sometest.com/proxy.pac \
    #NO_PROXY=".test.de,10.3.2.1" \


# enable storing the context on a named volume
RUN mkdir -p /data/context
RUN chown node-red:node-red /data/context
VOLUME ["/data/context"]

RUN mkdir -p /data/log
RUN chown node-red:node-red /data/log
VOLUME ["/data/log"]

# Copy package.json to the WORKDIR (/usr/src/node-red) so npm builds all
# of your added nodes modules for Node-RED
COPY docker/package.json .
#COPY docker/package-lock.json .
RUN npm install --unsafe-perm --no-update-notifier --no-fund --only=production

# Copy _your_ Node-RED project files into place
# NOTE: This will only work if you DO NOT later mount /data as an external volume.
#       If you need to use an external volume for persistence then
#       copy your settings and flows files to that volume instead.
COPY docker/settings.js /data/settings.js
COPY docker/flows_cred.json /data/flows_cred.json
COPY doc/flows/test-flow.json /data/flows.json

# Copy entrypoint.sh
COPY docker/entrypoint.sh /data/entrypoint.sh

USER root

# correct line endings
RUN apk --no-cache add dos2unix
RUN dos2unix /data/entrypoint.sh
RUN apk del --purge dos2unix

# Make entrypoint.sh executable
RUN chmod +x /data/entrypoint.sh
# Allow node-red to change flows.json and flows_cred.json by scripts
RUN chown node-red:node-red /data/flows.json
RUN chown node-red:node-red /data/flows_cred.json

# install node-red-contrib-msb
COPY . /opt/node-red-contrib-msb-master
WORKDIR /opt/node-red-contrib-msb-master
RUN npm install
# install node-red-contrib-msb to node-red
WORKDIR /usr/src/node-red
RUN npm install /opt/node-red-contrib-msb-master

USER node-red

# You should add extra nodes via your package.json file but you can also add them here:
# WORKDIR /usr/src/node-red
# RUN npm install node-red-node-smooth

ENTRYPOINT ["/data/entrypoint.sh"]

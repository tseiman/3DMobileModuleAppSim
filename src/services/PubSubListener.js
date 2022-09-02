
'use strict';

require('dotenv').config();

  const config     = require('config');
  const pubsubConf = config.get('pubsub');


module.exports = {
  setup: function () {
    if(!pubsubConf.enable) {
      console.log(`PubSubListener disabled`);
      return;
    }
    const { PubSub } = require(`@google-cloud/pubsub`);
    const {BigQuery} = require('@google-cloud/bigquery');


    const pubsubClient = new PubSub();
    const bigquery = new BigQuery();

    if(!doesSubscriptionExist()) {
        console.log("subscription does not exist");
        createSubscription().catch(console.error);
    }

    const subscription = pubsubClient.subscription(pubsubConf.subscriptionName);

// ----------------------------------
// ----------------------------------

    async function createSubscription() {
      // Creates a new subscription
      await pubsubClient.topic(pubsubConf.topicName).createSubscription(pubsubConf.subscriptionName);
      console.log(`Subscription ${pubsubConf.subscriptionName} created.`);
    }
// ----------------------------------

    async function doesSubscriptionExist() {
      const subscriptions = await pubsubClient.getSubscriptions();
      const subscriptionExist = subscriptions.find((sub) => sub.name === pubsubConf.subscriptionName);
      return (subscriptions && subscriptionExist);
    }

// ----------------------------------
    function storeGnssPush(data,message) {
        try {
            
            if(!data.data.gpstime) {
                console.error("gpstime record missing: "+ JSON.stringify(data));
                return;
            }

            if(!data.data.lat)              data.data.lat           = "";
            if(!data.data.lon)              data.data.lon           = "";
            if(!data.data.fixtype)          data.data.fixtype       = "";
            if(!data.data.HEPE)             data.data.HEPE          = "";
            if(!data.data.Altitude)         data.data.Altitude      = "";
            if(!data.data.AltUnc)           data.data.AltUnc        = "";
            if(!data.data.Direction)        data.data.Direction     = "";
            if(!data.data.HorSpeed)         data.data.HorSpeed      = "";
            if(!data.data.VerSpeed)         data.data.VerSpeed      = "";

            
            var gpsTimeTokenized = data.data.gpstime.match(/^ *([0-9]{4}) *(1?[0-9]) *([1-3]?[0-9]) *([0-2]?[0-9]):([0-5][0-9]):([0-5][0-9])/);

            for(var i = 2; i < 7; ++i) {
                if(gpsTimeTokenized[i].length < 2 ) gpsTimeTokenized[i] = '0' + gpsTimeTokenized[i];
            }
            var strGpsTime = `${gpsTimeTokenized[1]}-${gpsTimeTokenized[2]}-${gpsTimeTokenized[3]} ${gpsTimeTokenized[4]}:${gpsTimeTokenized[5]}:${gpsTimeTokenized[6]}`

            const row = [{
                    'time'          : data.time,
                    'ownerid'       : data.id,
                    'lat'           : parseFloat(data.data.lat),
                    'lon'           : parseFloat(data.data.lon),
                    'gpstime'       : strGpsTime,
                    'fixtype'       : data.data.fixtype,
                    'HEPE'          : parseFloat(data.data.HEPE),
                    'Altitude'      : parseFloat(data.data.Altitude),
                    'AltUnc'        : parseFloat(data.data.AltUnc),
                    'Direction'     : parseInt(data.data.Direction),
                    'HorSpeed'      : parseInt(data.data.HorSpeed),
                    'VerSpeed'      : parseInt(data.data.VerSpeed)
                }];

            var dbConfig = pubsubConf.destinations.gnssPush;
            console.log(`Storing data to: to BigQuery datasetId: ${dbConfig.datasetId}, tableId: ${dbConfig.tableId}`);
            bigquery.dataset(dbConfig.datasetId).table(dbConfig.tableId).insert(row);
        } catch (e) { console.error(e); }
    }
// ----------------------------------

    const messageHandler = message => {
        console.log(`message received ${message.id} Data: ${message.data}`);
        var data = JSON.parse(message.data);
        message.ack();

        if(!data.data) {
            console.error("data record missing: "+ JSON.stringify(data));
            return;
        }
        if(!data.time) {
            console.error("time record missing: "+ JSON.stringify(data));
            return;
        }
        if(!data.id) {
            console.error("id record missing: "+ JSON.stringify(data));
            return;
        }
        if(!data.dest) {
            console.error("destination record missing: "+ JSON.stringify(data));
            return;
        }

        if(message.dest === 'gnssPush') {
            storeGnssPush(data, message);            
        } else {
            console.error("Not implemented destination: " + message.dest)
        }

    };
// ----------------------------------
// ----------------------------------
    subscription.on(`message`, messageHandler);

    console.log(`Started PubSub Service for subscription: ${pubsubConf.subscriptionName}, topicName: ${pubsubConf.topicName}`); //to BigQuery datasetId: ${pubsubConf.datasetId}, tableId: ${pubsubConf.tableId}`);
        

  }
};

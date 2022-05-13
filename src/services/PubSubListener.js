
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

    async function createSubscription() {
      // Creates a new subscription
      await pubsubClient.topic(pubsubConf.topicName).createSubscription(pubsubConf.subscriptionName);
      console.log(`Subscription ${pubsubConf.subscriptionName} created.`);
    }

    async function doesSubscriptionExist() {
      const subscriptions = await pubsubClient.getSubscriptions();
      const subscriptionExist = subscriptions.find((sub) => sub.name === pubsubConf.subscriptionName);
      return (subscriptions && subscriptionExist);
    }

    if(!doesSubscriptionExist()) {
        console.log("subscription does not exist");
        createSubscription().catch(console.error);
    }

    const subscription = pubsubClient.subscription(pubsubConf.subscriptionName);


    const messageHandler = message => {
        console.log(`message received ${message.id} Data: ${message.data}`);
        var data = JSON.parse(message.data);
        message.ack();

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

        bigquery.dataset(pubsubConf.datasetId).table(pubsubConf.tableId).insert(row);
    };

    subscription.on(`message`, messageHandler);

    console.log(`Started PubSub Service for subscription: ${pubsubConf.subscriptionName}, topicName: ${pubsubConf.topicName} to BigQuery datasetId: ${pubsubConf.datasetId}, tableId: ${pubsubConf.tableId}`);
    
  }
};

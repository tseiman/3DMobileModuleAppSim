
/*
 * this handles the Demo page  API
*/

"use strict";

require('dotenv').config();

const express                   = require('express');
const {BigQuery} = require('@google-cloud/bigquery');
const config = require('config');
const apiConf = config.get('apiconf');
const pubsubConf = config.get('pubsub');


module.exports = {
  setup: function () {

    const bigquery = new BigQuery();

/*    if(!apiConf.enable) {
      console.log(`API disabled`);
      return;
    }
*/
    var app = express();


    app.get("/suitcase", (req, res, next) => {

        console.info(`Client access for API  /suitcase from "${req.connection.remoteAddress}"`);

        let ownerId = req.query.id;


        res.setHeader('content-type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if(!ownerId) {
            res.send(JSON.stringify({'type' : 'error', 'causeid': 1, 'cause': 'user ID not specified'}));
        }
        const query = `SELECT * FROM \`${apiConf.projectId}.${pubsubConf.datasetId}.${pubsubConf.tableId}\` where time=(select max(time) from \`${apiConf.projectId}.${pubsubConf.datasetId}.${pubsubConf.tableId}\`)  and ownerid="${ownerId}" LIMIT 1`;

        const options = {
            query: query,
            location: apiConf.region,
        };

        async function queryData() {
            const [job] = await bigquery.createQueryJob(options);
            console.log(`BigQuery job ${job.id} started.`);
            const [rows] = await job.getQueryResults();
            res.send(JSON.stringify(rows[0]));
        }

        queryData();


    });

    return app;


  }
}

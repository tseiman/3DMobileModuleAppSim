
/*
 * this handles the Demo page  API
*/

"use strict";

require('dotenv').config();

const express                   = require('express');
const {BigQuery} = require('@google-cloud/bigquery');
const bodyParser = require('body-parser');
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
    app.use(express.json());

    app.get("/suitcase", (req, res, next) => {

        console.info(`Client access for API  /suitcase from "${req.connection.remoteAddress}"`);

        let ownerId = req.query.id;


        res.setHeader('content-type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if(!ownerId) {
            res.send(JSON.stringify({'type' : 'error', 'causeid': 10, 'cause': 'user ID not specified'}));
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

    app.post("/bookflight", jsonParser, (req, res) => {

        console.info(`Client access for API  /bookflight from "${req.connection.remoteAddress}"`);

        if(!req.body.username) {
            res.send(JSON.stringify({'type' : 'error', 'causeid': 20, 'cause': 'user ID not specified'}));
        }

        var query = `SELECT * FROM \`${apiConf.projectId}.${pubsubConf.datasetId}.${pubsubConf.userTableId}\` where username=\`${req.body.username}\``;


        var options = {
            query: query,
            location: apiConf.region,
        };

        async function queryData() {
            const [job] = await bigquery.createQueryJob(options);
            console.log(`BigQuery job ${job.id} started.`);
            const [rows] = await job.getQueryResults();
            return rows;
        }

        var data = await queryData();
        if(data.length === 0) {
            res.send(JSON.stringify({'type' : 'error', 'causeid': 30, 'cause': 'user ID not present'}));
        }
        
        
        var query = `INSERT INTO \`${apiConf.projectId}.${pubsubConf.datasetId}.${pubsubConf.bookedFlights}\` 
            (flightno,destShort,destination,origin,username,timestamp,info1,info2) 
            VALUES (\`${req.body.flightno}\`,
                    \`${req.body.destShort}\`,
                    \`${req.body.destination}\`,
                    \`${req.body.origin}\`,
                    \`${req.body.username}\`,
                    \`${req.body.timestamp}\`,
                    \`${req.body.info1}\`,
                    \`${req.body.info2}\`)`;


        var options = {
            query: query,
            location: apiConf.region,
        };

        var data = await queryData();

        res.send(JSON.stringify({'type' : 'OK'}));
    });


    return app;


  }
}

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
// const cors = require('cors');
const pubsubConf = config.get('pubsub');

module.exports = {
    setup: function () {

        const bigquery = new BigQuery();

        var app = express();

        app.use(express.json());

        app.get("/suitcase", (req, res, next) => {

            console.info(`Client access for API  /suitcase from "${req.connection.remoteAddress}"`);

            let ownerId = req.query.id;


            res.setHeader('content-type', 'application/json');

            if(!ownerId) {
                return res.send(JSON.stringify({'type' : 'error', 'causeid': 10, 'cause': 'user ID not specified'}));
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
                if(rows.length > 0) {
                    return res.send(JSON.stringify(rows[0]));
                }
                return res.send(JSON.stringify({'type' : 'error', 'causeid': 15, 'cause': 'no results'}));
            }

            queryData();


        });

        app.post("/bookflight", async (req, res) => {

            console.info(`Client access for API  /bookflight from "${req.connection.remoteAddress}"  ${JSON.stringify(req.body)}`);
            res.setHeader('content-type', 'application/json');

            if(!req.body.username) {
                console.error("User ID not specified - data was: " + JSON.stringify(req.body));
                return res.send(JSON.stringify({'type' : 'error', 'causeid': 20, 'cause': 'user ID not specified'}));
            }

            var query = `SELECT * FROM \`${apiConf.projectId}.${pubsubConf.datasetId}.${apiConf.userTableId}\` where username='${req.body.username}'`;

            console.log("prepare statement to DB: " + query)

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
            console.log("Data from the User is in DB check:" + JSON.stringify(data));
            if(data.length === 0) {
                return res.send(JSON.stringify({'type' : 'error', 'causeid': 30, 'cause': 'user ID not present'}));
                console.error(`The database does not contain such user: ${req.body.username}`);
            }
            if((!req.body.destShort )||(!req.body.destination )||(!req.body.origin )||(!req.body.username )||(!req.body.timest )||(!req.body.info1 )||(!req.body.info2 )) {
                return res.send(JSON.stringify({'type' : 'error', 'causeid': 40, 'cause': 'missing fields', datawas: req.body}));
                console.error("the request had missing fields:" + JSON.Stringify(req.body));
            }

            var query = `INSERT INTO \`${apiConf.projectId}.${pubsubConf.datasetId}.${apiConf.bookedFlightsTableId}\`
                (flightno,destShort,destination,origin,username,timestamp,info1,info2)
                VALUES ('${req.body.flightno}',
                        '${req.body.destShort}',
                        '${req.body.destination}',
                        '${req.body.origin}',
                        '${req.body.username}',
                        TIMESTAMP_SECONDS(${req.body.timest}),
                        '${req.body.info1}',
                        '${req.body.info2}')`;
            console.log("prepare statement to DB: " + query)


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
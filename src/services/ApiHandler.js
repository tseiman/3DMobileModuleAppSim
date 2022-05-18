/*
 * this handles the Demo page  API
*/

"use strict";

require('dotenv').config();

const express                   = require('express');
const {BigQuery} = require('@google-cloud/bigquery');
const iot = require('@google-cloud/iot');

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
            var deviceID = data[0].DeviceID;
            var firstName = data[0].FirstName;
            var secondName = data[0].SecondName;

            console.log("Device ID: ", deviceID);

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

            var msg = {
                'firstName'     : firstName,
                'secondName'    : secondName,                
                'flightno'      : req.body.flightno,
                'destShort'     : req.body.destShort,
                'destination'   : req.body.destination,
                'origin'        : req.body.origin,
                'username'      : req.body.username,
                'timest'        : req.body.timest,
                'info1'         : req.body.info1,
                'info2'         : req.body.info2
            };


            async function sendCommand(projectId,cloudRegion,registryId,deviceId,data) {
                const iotClient = new iot.v1.DeviceManagerClient();

                // Construct request
                const formattedName = iotClient.devicePath(
                    projectId,
                    cloudRegion,
                    registryId,
                    deviceId
                );

                //  const binaryData = Buffer.from(commandMessage);
                var myData = {'type':'someTest','time': new Date().getTime()};
                const request = {
                    name: formattedName,
                    binaryData: Buffer.from(JSON.stringify(data)),
                };

                const [response] = await iotClient.sendCommandToDevice(request);
                console.log('Sent command: ', response);
            }

            try {
                await sendCommand(apiConf.projectId, apiConf.region, apiConf.iotRegistryID, deviceID, msg);
            } catch(e) {
                console.error(e);
            }

            res.send(JSON.stringify({'type' : 'OK'}));
        });


        return app;


    }
}
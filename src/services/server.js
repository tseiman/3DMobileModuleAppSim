"use strict";
const bodyParser 								= require('body-parser');
const express 									= require('express');
const fs 												= require("fs");

const viewerApp = express();

const config = require('config');

const frontendConf = config.get('frontend');


module.exports = {
  setup: function () {


		viewerApp.set('view engine', 'ejs');
//		viewerApp.use(express.static('static'));
//			viewerApp.use(bodyParser.urlencoded({ extended: false }));
//		viewerApp.use(bodyParser.json());
		viewerApp.use(express.static("views/static"));



		viewerApp.get("/app/*", (req, res, next) => {
		    res.filename = req.params[0].replace("app/","");
     	  console.info(`Client access for "${res.filename}" page from "${req.connection.remoteAddress}"`);


		    let fileExists = new Promise((resolve, reject) => {
		        // check if file exists
		        fs.stat("views/" + res.filename + ".ejs", (err, stats) => {
		            if (err) {
		                return reject(err);
		            }
		            return resolve(stats);
		        });
		    });

		    fileExists.then((stats) => {
		        res.stats = stats;
					  res.render(res.filename);

		    }).catch((err) => {
		    		console.error(err);
		        res.stats = { error: err };
		        next();
		    });

		});


/*	viewerApp.get('/', function(req, res) {
	  Logger.info(`Client access for index page ${req.connection.remoteAddress}`);
	  res.render('index');
	});

*/

		viewerApp.listen(frontendConf.webuiport, ()=>console.info(`viewer listening to port ${frontendConf.webuiport}`));

  }
};
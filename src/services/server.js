// "use strict";
// const bodyParser 								= require('body-parser');
const express 									= require('express');
// const fs 												= require("fs");
// const path 											= require('path');
// const connect 									= require('connect')
const vhost 										= require('vhost');
const Demohandler								= require('./demohandler');

const viewerApp = express();


const config = require('config');
const frontendConf = config.get('frontend');


module.exports = {
  setup: function () {

  	var demoserver = Demohandler.setup();

		var domainfilter = ".*.*"
		if(frontendConf.domainfilter) domainfilter = frontendConf.domainfilter;
		domainfilter = 'sierrademo' + domainfilter;
		console.log("setting up VHOST: " + domainfilter);
		viewerApp.use(vhost( domainfilter, demoserver));


		const PORT = parseInt(process.env.PORT) || frontendConf.webuiport;

		viewerApp.listen(PORT, ()=>console.info(`viewer listening to port ${PORT}`));

  }

};
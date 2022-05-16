"use strict";
// const bodyParser 								= require('body-parser');
const express 									= require('express');
// const fs 												= require("fs");
// const path 											= require('path');
// const connect 									= require('connect')
const vhost 										= require('vhost');
const Demohandler								= require('./demohandler');
const FindMySuitcaseHandler			= require('./FindMySuitcaseHandler');
const SierraFlightHandler				= require('./SierraFlightHandler');
const ApiHandler								= require('./ApiHandler');

const viewerApp = express();


const config = require('config');
const frontendConf = config.get('frontend');


module.exports = {
  setup: function () {

  	var demoserver = Demohandler.setup();
  	var findMySuitcaseHandler = FindMySuitcaseHandler.setup();
  	var sierraFlightHandler = SierraFlightHandler.setup();
  	var apiHandler = ApiHandler.setup();

		var domainfilterDemo = ".*.*"
		if(frontendConf.domainfilter) domainfilterDemo = frontendConf.domainfilter;
		domainfilterDemo = 'sierrademo' + domainfilterDemo;
		console.log("setting up VHOST: " + domainfilterDemo);
		viewerApp.use(vhost( domainfilterDemo, demoserver));

		var domainfilterFindSuitcase = ".*.*"
		if(frontendConf.domainfilter) domainfilterFindSuitcase = frontendConf.domainfilter;
		domainfilterFindSuitcase = 'findmysuitcase' + domainfilterFindSuitcase;
		console.log("setting up VHOST: " + domainfilterFindSuitcase);
		viewerApp.use(vhost( domainfilterFindSuitcase, findMySuitcaseHandler));

		var domainfilterSierraFlightHandler= ".*.*"
		if(frontendConf.domainfilter) domainfilterSierraFlightHandler = frontendConf.domainfilter;
		domainfilterSierraFlightHandler = 'sierraflight' + domainfilterSierraFlightHandler;
		console.log("setting up VHOST: " + domainfilterSierraFlightHandler);
		viewerApp.use(vhost( domainfilterSierraFlightHandler, sierraFlightHandler));

		var domainfilterApihandler = ".*.*"
		if(frontendConf.domainfilter) domainfilterApihandler = frontendConf.domainfilter;
		domainfilterApihandler = 'suitcase-api' + domainfilterApihandler;
		console.log("setting up VHOST: " + domainfilterApihandler);
		viewerApp.use(vhost( domainfilterApihandler, apiHandler));


		const PORT = parseInt(process.env.PORT) || frontendConf.webuiport;

		viewerApp.listen(PORT, ()=>console.info(`viewer listening to port ${PORT}`));

  }

};

import { ATProcedures } from '/js/static/command-window/ATProcedures.js';

const CONNECTION_STATES = {
    DETACHED 		: 'detached',
    ATTACHED 		: 'attached',
    TCPCONNECTED 	: 'tcpconnected',
    MQTTCONNECTED 	: 'mqttconnected'
};

const GNSS_STATES = {
    STOPPED 	: 'stopped',
    RUNNING		: 'running'
};

const OPERATIONS_STEPS = {
    GNSS 		: 'gnss',
    MOBILE		: 'mobile'
};

class ConnectionManager {



	constructor(serialIO, logger, config, urcHandler) { 
		this.logger = logger;
		this.serialIO = serialIO;
		this.config = config;
		this.lastGnssData = {};
		this.urcHandler = urcHandler;
		this.connectionState = CONNECTION_STATES.DETACHED;
		this.gnssState = GNSS_STATES.STOPPED;
		this.operationSteps = OPERATIONS_STEPS.GNSS;

		this.enableTCPCleanup = true;

		var that = this;

window.connectionManager = this;
//		this.tcp
		this.atProcedures = new ATProcedures(serialIO, logger, config);


		this.urcHandler.registerURCHandler("CONMGR-cXreg-handler", '^\\\+CE?REG', function(data) {
			const REG_PATTERN = /^\+C.?REG: *([0-5],)?([0-9]),?.*/g;
			var param = REG_PATTERN.exec(data);
			switch (param[2]) {
			  case '1': case '5': 						that.connectionState = CONNECTION_STATES.ATTACHED; break;
			  default: 									that.connectionState = CONNECTION_STATES.DETACHED; break;
			}
		}, null);
		this.urcHandler.registerURCHandler("CONMGR-GNSSEV-handler", '^\\\+GNSSEV: *[0-3]', function(data) {
			const REG_PATTERN = /^\+GNSSEV: *([0-3]),([0-4])/g;
			var param = REG_PATTERN.exec(data);
			if(param[1] === '3' && parseInt(param[2]) > 0 && parseInt(param[2]) < 4) {
				that.gnssState = GNSS_STATES.RUNNING;				
			} else { 
				that.gnssState = GNSS_STATES.STOPPED;		
			}
		}, null);
		this.urcHandler.registerURCHandler("CONMGR-TCP-Con", '^\\\+KTCP_IND: *[0-9],1', function(data) {
			that.connectionState = CONNECTION_STATES.TCPCONNECTED;
		}, null);
		this.urcHandler.registerURCHandler("CONMGR-TCP-Discon", '^\\\+KTCP_NOTIF: *[1-6],[0-1]?[0-9]', function(data) {
			that.connectionState = CONNECTION_STATES.ATTACHED;
			console.log("registerURCHandler CONMGR-TCP-Con:" + that.enableTCPCleanup);
			if(that.enableTCPCleanup) that.atProcedures.disconnectTCP();
		}, null);

		this.regularOperationInterval = null;

	}


	async regularOperation(that) {
		that.logger.info("execute regular operations - START");
		if(that.connectionState === CONNECTION_STATES.DETACHED) {
			that.logger.norm("cant execute regular operation - SKIPPING");
		}
		clearInterval(that.regularOperationInterval);

		switch(that.operationSteps) {
			case OPERATIONS_STEPS.GNSS: 
				await that.runGNSS();
				that.operationSteps = OPERATIONS_STEPS.MOBILE;
				break;
			case OPERATIONS_STEPS.MOBILE: 
				await that.runMqttPublish();
				that.operationSteps = OPERATIONS_STEPS.GNSS;
				break;
			default: that.logger.warn("Operations step not alowed: " + that.operationSteps);
		}
		
		
		that.regularOperationInterval = setInterval(that.regularOperation, that.interval,that);
		that.logger.info("execute regular operations - DONE");
	}


	setupRegularOperation() {
		this.interval = parseInt(this.config.getValue('regular-operation-cycle'));
		if(this.interval < 10000) {
			this.logger.warn(`interval can't be set to ${this.interval} - setting to default 10000ms`);
			this.interval = 10000;
		}
		this.logger.info("setting up regular operation with " + this.interval + " delay.");
		if(this.regularOperationInterval !== null) {
			console.warn("regular operation already running");
			return;
		}
		this.regularOperationInterval = setInterval(this.regularOperation, this.interval,this);

	}
	destroyRegularOperation() {
		this.logger.info("stopping regular operation");
		if(this.regularOperationInterval === null) {
			this.logger.info("can't stop the regular operation it is either not started or curently running");
			return;
		} 
		clearInterval(this.regularOperationInterval);
		this.regularOperationInterval = null;

	}



	async runMqttPublish() {
		var mqttData = {
			time 	: parseInt(Date.now() / 1000),
			id 		: this.config.getValue('findmysuitcase-id'), 
			data 	: this.lastGnssData
		};

		var topic = "/devices/" + this.config.getValue('googleIoTClientID') + "/events";

		if(this.gnssState === GNSS_STATES.RUNNING) {
			this.logger.warn("Device is in GNSS mode");
			return;
		} 
		if(this.connectionState === CONNECTION_STATES.DETACHED) {
			this.logger.warn("Device not connected");
			return;
		}

		if(this.connectionState === CONNECTION_STATES.ATTACHED) {
			console.log("running connectTCP(), connectMQTT(), publishMQTT()");
			var ret = await this.atProcedures.connectTCP();
			ret = await this.atProcedures.connectMQTT();
			ret = await this.atProcedures.publishMQTT(topic, mqttData);
			this.connectionState = CONNECTION_STATES.MQTTCONNECTED;
			return;
		}
		if(this.connectionState === CONNECTION_STATES.TCPCONNECTED) {
			console.log("running connectMQTT(), publishMQTT()");
			var ret = await this.atProcedures.connectMQTT();
			ret = await this.atProcedures.publishMQTT(topic, mqttData);
			this.connectionState = CONNECTION_STATES.MQTTCONNECTED;
			return;
		}

		if(this.connectionState === CONNECTION_STATES.MQTTCONNECTED) {
			console.log("running  publishMQTT()");
			var ret = await this.atProcedures.publishMQTT(topic, mqttData);
			this.connectionState = CONNECTION_STATES.MQTTCONNECTED;
		}
	}

	async runGNSS() {
		this.enableTCPCleanup = false;
		await this.atProcedures.disconnectTCP();
		this.lastGnssData = await this.atProcedures.gnssPoll();
		this.enableTCPCleanup = true;
	}

	async init() {
		await this.atProcedures.init();
	}

}
export { ConnectionManager };

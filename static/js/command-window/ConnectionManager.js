
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
/*
const OPERATIONS_STEPS = {
    GNSS 		: 'gnss',
    MOBILE		: 'mobile'
};
*/
class ConnectionManager {



	constructor(serialIO, logger, config, urcHandler) { 
		this.logger = logger;
		this.serialIO = serialIO;
		this.config = config;
		this.lastGnssData = {};
		this.urcHandler = urcHandler;
		this.connectionState = CONNECTION_STATES.DETACHED;
		this.gnssState = GNSS_STATES.STOPPED;
	//	this.operationSteps = OPERATIONS_STEPS.GNSS;

		this.enableTCPCleanup = true;
		this.actualEventStep =0;

		this.regularOperationRunning = false;

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
			const REG_PATTERN = /^\+KTCP_NOTIF: *([0-6]),([0-1]?[0-9])/g;
			var param = REG_PATTERN.exec(data);
			if(param[2] !== '8') {
				console.log("registerURCHandler CONMGR-TCP-Con:" + that.enableTCPCleanup);
				if(that.enableTCPCleanup) that.atProcedures.disconnectTCP();
			}
		}, null);

		this.regularOperationInterval = null;

		this.atProcedures.registerTcpMqttRecHandler("connMgr.HandleIncommingTCP", 
			function(mqtt) {return (mqtt.type === 'PUBLISH'); },
			function(mqtt) { 
				mqtt.retMsg.msg = JSON.parse(mqtt.retMsg.msg);
				console.log("General TCP Handler:", mqtt); 
			}
		);

	}


	async regularOperation(that) {
	//	that.logger.info("execute regular operations - START");
	//	console.log(that.actualEventStep, that.pingSteps);
		if(that.connectionState === CONNECTION_STATES.DETACHED) {
			that.logger.norm("cant execute regular operation - SKIPPING");
		}

		if(!that.regularOperationRunning) {
			clearInterval(that.regularOperationInterval);
			that.regularOperationInterval = null;
			that.logger.norm("Stopping regular operation");
			return;
		}
		if(that.pingSteps.includes(that.actualEventStep)) {
			that.logger.info("execute Ping");
			clearInterval(that.regularOperationInterval);
			await that.runPing();
			that.regularOperationInterval = setInterval(that.regularOperation, that.eventCycleStepDelay,that);
		}
		if(that.gnssSteps.includes(that.actualEventStep)) {
			that.logger.info("execute GNSS");
			clearInterval(that.regularOperationInterval);
			await that.runGNSS();
			that.regularOperationInterval = setInterval(that.regularOperation, that.eventCycleStepDelay,that);
		}
		if(that.mqttPosPushSteps.includes(that.actualEventStep)) {
			that.logger.info("execute MQTT Position Push");
			clearInterval(that.regularOperationInterval);
			await that.runMqttPublish();
			that.regularOperationInterval = setInterval(that.regularOperation, that.eventCycleStepDelay,that);
		}

		++that.actualEventStep;
		if(that.actualEventStep > that.eventLoopSize) that.actualEventStep = 0;
	
	}



	setupRegularOperation() {

		this.pingSteps = this.config.getValue('ping-steps').split(',').map(iNum => parseInt(iNum));
		this.gnssSteps = this.config.getValue('gnss-steps').split(',').map(iNum => parseInt(iNum));
		this.mqttPosPushSteps = this.config.getValue('mqtt-pos-push-steps').split(',').map(iNum => parseInt(iNum));
		this.eventLoopSize = parseInt(this.config.getValue('event-loop-size')) < 2 ? 2 : parseInt(this.config.getValue('event-loop-size'));
		this.eventCycleStepDelay = parseInt(this.config.getValue('event-cycle-step-delay')) < 1000 ? 1000 : parseInt(this.config.getValue('event-cycle-step-delay'));
		this.logger.info(`setting up regular operation with ${this.eventCycleStepDelay}ms delay and ${this.eventLoopSize} loops size.`);
		this.actualEventStep =0;
		this.regularOperationRunning = true;

		if(this.regularOperationInterval !== null) {
			console.warn("regular operation already running");
			return;
		}
		this.regularOperationInterval = setInterval(this.regularOperation, this.eventCycleStepDelay, this);

	}
	destroyRegularOperation() {
		if(!this.regularOperationRunning) { 
			this.logger.info("regular operation it curently not running");
			return;
		}
		this.regularOperationRunning = false;

	}



	async runMqttConnect() {

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
			ret = await this.atProcedures.subscribeMQTT(`/devices/${this.config.getValue('googleIoTClientID')}/commands/#`);
			this.connectionState = CONNECTION_STATES.MQTTCONNECTED;
			return;
		}
		if(this.connectionState === CONNECTION_STATES.TCPCONNECTED) {
			console.log("running connectMQTT(), publishMQTT()");
			var ret = await this.atProcedures.connectMQTT();
			ret = await this.atProcedures.subscribeMQTT(`/devices/${this.config.getValue('googleIoTClientID')}/commands/#`);
			this.connectionState = CONNECTION_STATES.MQTTCONNECTED;
			return;
		}

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
			ret = await this.atProcedures.subscribeMQTT(`/devices/${this.config.getValue('googleIoTClientID')}/commands/#`);
			ret = await this.atProcedures.publishMQTT(topic, mqttData);
			this.connectionState = CONNECTION_STATES.MQTTCONNECTED;
			return;
		}
		if(this.connectionState === CONNECTION_STATES.TCPCONNECTED) {
			console.log("running connectMQTT(), publishMQTT()");
			var ret = await this.atProcedures.connectMQTT();
			ret = await this.atProcedures.subscribeMQTT(`/devices/${this.config.getValue('googleIoTClientID')}/commands/#`);
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

	async runPing() {
		if(this.gnssState === GNSS_STATES.RUNNING) {
			this.logger.warn("Device is in GNSS mode");
			return;
		} 
		if(this.connectionState === CONNECTION_STATES.DETACHED) {
			this.logger.warn("Device not connected");
			return;
		}

		if(this.connectionState === CONNECTION_STATES.ATTACHED) {
			console.log("running connectTCP(), connectMQTT(), pingMQTT()");
			var ret = await this.atProcedures.connectTCP();
			ret = await this.atProcedures.connectMQTT();
			ret = await this.atProcedures.subscribeMQTT(`/devices/${this.config.getValue('googleIoTClientID')}/commands/#`);
			ret = await this.atProcedures.pingMQTT();
			this.connectionState = CONNECTION_STATES.MQTTCONNECTED;
			return;
		}
		if(this.connectionState === CONNECTION_STATES.TCPCONNECTED) {
			console.log("running connectMQTT(), pingMQTT()");
			var ret = await this.atProcedures.connectMQTT();
			ret = await this.atProcedures.subscribeMQTT(`/devices/${this.config.getValue('googleIoTClientID')}/commands/#`);
			ret = await this.atProcedures.pingMQTT();
			this.connectionState = CONNECTION_STATES.MQTTCONNECTED;
			return;
		}

		if(this.connectionState === CONNECTION_STATES.MQTTCONNECTED) {
			console.log("running  pingMQTT()");
			var ret = await this.atProcedures.pingMQTT();
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

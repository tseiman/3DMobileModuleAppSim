
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

class ConnectionManager {



	constructor(serialIO, logger, config, urcHandler) { 
		this.logger = logger;
		this.serialIO = serialIO;
		this.config = config;
		this.lastGnssData = {};
		this.urcHandler = urcHandler;
		this.connectionState = CONNECTION_STATES.DETACHED;
		this.gnssState = GNSS_STATES.STOPPED;

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
		this.urcHandler.registerURCHandler("CONMGR-TCP-Con", '^\\\+KTCP_NOTIF: *1[0-9,[0-9]+', function(data) {
			that.connectionState = CONNECTION_STATES.ATTACHED;
			console.log("registerURCHandler CONMGR-TCP-Con:" + that.enableTCPCleanup);
			if(that.enableTCPCleanup) that.atProcedures.disconnectTCP();
		}, null);
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

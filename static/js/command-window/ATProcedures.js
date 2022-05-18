/*
const State = {
		detached: 'Detached',
		attached: 'Attached'
};
*/

import { SimpleMQTT } from '/js/static/command-window/SuperSimpleMqttClient.js';
import { GNSSHelper } from '/js/static/command-window/GNSSHelper.js';

class ATProcedures {



	constructor(serialIO, logger, config) {
		this.logger = logger;
		this.serialIO = serialIO;
		this.config = config;
		this.tcpSessionID = -1;
		this.httpSessionID = -1;
		self.tcpRecTimeOHandler = null;
		this.tcpMqttRecHandlerCallBack = new Map();

window.atProcedures = this;

		this.mqttClientId = `projects/${this.config.getValue("google-project")}/locations/${this.config.getValue("google-regions")}/registries/${this.config.getValue("google-iotcore-registry")}/devices/${this.config.getValue("googleIoTClientID")}`;

		this.thismqttClient = new SimpleMQTT({
			"clientID"			: this.mqttClientId, 
			"username"			: "ignored",  
			"password"			: "",
			"projectId" 		: (typeof this.config.getValue("google-project") !== 'undefined') ? this.config.getValue("google-project") : "",
			"privateKey" 		: (typeof this.config.getValue("google-client-priv-key") !== 'undefined') ? this.config.getValue("google-client-priv-key") : "",
			"logger"			: this.logger,
			"keepAlive"			: (typeof this.config.getValue("mqtt-keep-alive") !== 'undefined') ? this.config.getValue("mqtt-keep-alive") : "0"
    	});

		this.serialIO.registerCallback ("atprocedure.WaitForTCPRec", '.*KTCP_DATA: *[1-9],[0-9]+.*', this.tcpMqttRecHandler,this);

	}

	registerTcpMqttRecHandler(name,f,callback) {
		if(name in this.tcpMqttRecHandlerCallBack) {
			console.warn("tcpMqttRecHandler with the name " + name + " exists already. Callback ignored !!!");
			return;
		}
	    this.tcpMqttRecHandlerCallBack.set(name, {'name': name, 'comparisonFunction': f, 'callback':  callback });
	}

	removeTcpMqttRecHandler(name) {
		if(this.tcpMqttRecHandlerCallBack.size === 0) {
			console.warn("NO TcpMqttRecHandler defined can't destroy");
			return;
		}
		if(! this.tcpMqttRecHandlerCallBack.has(name)) {
			console.error("TcpMqttRecHandler \"" + name + "\" is not defined, nothing removed !");
			return;
		}
		this.tcpMqttRecHandlerCallBack.delete(name);
	}


	async tcpMqttRecHandler(data, callbackObj, recordedLines) {
		var self = callbackObj;
		var recLen = parseInt(data.match(/.*KTCP_DATA: *[0-9]+,([0-9]+).*/)[1]);
		self.logger.info("got : " +  recLen + " bytes in downstream");
		var res = await self.serialIO.sendAndExpect( 'AT+KTCPRCV=' + self.tcpSessionID + ',' + recLen ,'.*--EOF--Pattern--.*',5000);
		var resData = buffer.Buffer.from(res.data,"ascii").slice(0,recLen);
		var mqttInMsg = self.thismqttClient.parseMessage(resData);
		self.logger.info("got MQTT: " + JSON.stringify(mqttInMsg));

		if(self.tcpMqttRecHandlerCallBack.size === 0) return;
		
		self.tcpMqttRecHandlerCallBack.forEach(function (callback) {
			if((typeof callback.comparisonFunction !== 'undefined') && callback.comparisonFunction) {
				if(callback.comparisonFunction(mqttInMsg)) {
					callback.callback(mqttInMsg);
				}
			}			
		});

	}

	waitForTCPRec(comparisonFunction,timeout) {
		var self = this;

		return new Promise(function(resolve, reject) {
			if(timeout !== undefined) { 
	      		self.tcpRecTimeOHandler = setTimeout(function() { 
					console.warn("WaitForTCP Timeout after " + timeout);
					self.removeTcpMqttRecHandler("atprocedure.WaitForTCPRec");
					reject(null); 
			  	}, timeout);
			}
			self.registerTcpMqttRecHandler( "atprocedure.WaitForTCPRec",
				comparisonFunction,
				function (mqtt) { 
					clearTimeout(self.tcpRecTimeOHandler);
					self.removeTcpMqttRecHandler("atprocedure.WaitForTCPRec");
  					resolve(mqtt);

				}); 
		}); 
	
	//	this.tcpSessionID

	}

	async init() {
		var res =  await this.serialIO.sendAndExpect('AT','.*',2000); // Just clear any crap from UART
		res =  await this.serialIO.sendAndExpect('AT','.*',2000);
		res =  await this.serialIO.sendAndExpect('ATE0','.*OK.*',2000); // disable echo
		res =  await this.serialIO.sendAndExpect('AT+CFUN=1','^(.C.?REG: (0|1),(5|1).*|.*OK.*)',12000); // go online
		await this.serialIO.sleep(1000);
		res = await this.serialIO.sendAndExpect( 'ATI','.*HL7802.*',2000); // see we're working wiht the right module
		res = await this.serialIO.sendAndExpect( 'AT+CMEE=1','.*OK.*',2000); // error reporting on
		res = await this.serialIO.sendAndExpect( 'AT+CREG?','^.CREG: (0|1),(5|1).*',2000); // are we registered ?
		res = await this.serialIO.sendAndExpect( 'AT+CGREG?','^.CGREG: (0|1),(5|1).*',2000);
		for(var i = 1; i < 7; ++i) {
			res = await this.serialIO.sendAndExpect( 'AT+KTCPCLOSE=' + i ,'(.*OK.*|.*CME ERROR:.*)',2000);
			res = await this.serialIO.sendAndExpect( 'AT+KTCPDEL=' + i ,'(.*OK.*|.*CME ERROR:.*)',2000);
			res = await this.serialIO.sendAndExpect( 'AT+KHTTPCLOSE=' + i ,'(.*OK.*|.*CME ERROR:.*)',2000);
			res = await this.serialIO.sendAndExpect( 'AT+KHTTPDEL=' + i ,'(.*OK.*|.*CME ERROR:.*)',2000);
		}

		this.afterAttach();
	}

	async afterAttach() {

		//if(this.state === State.attached) return;
		//this.state = State.attached;

		var res = await this.serialIO.sendAndExpect( 'AT+KPATTERN="--EOF--Pattern--"','.*OK.*',2000); // set EOF pattern for internal stack
		if(this.config.getValue("apn") !== '') res = await this.serialIO.sendAndExpect( 'AT+CGDCONT=1,"IP","' + this.config.getValue("apn") + '"','.*OK.*',2000); // set APN (may needs username and PW)
		res =  await this.serialIO.sendAndExpect('ATE0','.*OK.*',2000); // disable echo
/*
		res = await this.serialIO.sendAndExpect( 'AT+KSSLCFG=0,3','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+KSSLCFG=1,"edge"','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+KSSLCFG=2,0','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+KSSLCRYPTO=1,9,3,25456,12,4,1,0','.*OK.*',2000);

		var certData = this.config.getValue("google-certificate"); //.replace(/\n/g, "\r");

	    res = await this.serialIO.sendAndExpect( 'AT+KCERTSTORE=0,' + (certData.length ) + ',0','.*CONNECT.*',5000);
	    res = await this.serialIO.sendAndExpect( certData ,'.*OK.*',2000,{noNewLine: true});
*/
	    res = await this.serialIO.sendAndExpect( 'AT+CTZU=0','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+CTZR=0','.*OK.*',2000);

	    var date = new Date();

		var jetzt = moment(date).format('YY/MM/DD,HH:mm:ss+08');
		res = await this.serialIO.sendAndExpect( 'AT+CCLK="' + jetzt + '"','.*OK.*',2000);
		res = await this.serialIO.sendAndExpect( 'AT+KCNXCFG=1,"GPRS","' + this.config.getValue("apn") + '"','.*OK.*',2000);

		this.setupForMqttTLS();

	}

	async setupForMqttTLS() {

		var res = await this.serialIO.sendAndExpect( 'AT+KSSLCFG=0,3','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+KSSLCFG=1,"edge"','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+KSSLCFG=2,0','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+KSSLCRYPTO=1,9,3,25456,12,4,1,0','.*OK.*',2000);

		var certData = this.config.getValue("google-certificate"); //.replace(/\n/g, "\r");

	    res = await this.serialIO.sendAndExpect( 'AT+KCERTSTORE=0,' + (certData.length ) + ',0','.*CONNECT.*',5000);
	    res = await this.serialIO.sendAndExpect( certData ,'.*OK.*',2000,{noNewLine: true});

	}

	async setupForHTTP() {

	
		var res = await this.serialIO.sendAndExpect( 'AT+KSSLCFG=0,3','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+KSSLCFG=1,"edge"','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+KSSLCFG=2,0','.*OK.*',2000);
	    res = await this.serialIO.sendAndExpect( 'AT+KSSLCRYPTO=1,9,3,25456,12,4,1,0','.*OK.*',2000);

		var certData = this.config.getValue("letsencypt-certificate"); //.replace(/\n/g, "\r");

	    res = await this.serialIO.sendAndExpect( 'AT+KCERTSTORE=0,' + (certData.length ) + ',0','.*CONNECT.*',5000);
	    res = await this.serialIO.sendAndExpect( certData ,'.*OK.*',12000,{noNewLine: true});

	}

	async getFlightTicketViaHTTP() {

		var res = await this.serialIO.sendAndExpect( 'AT+KIPOPT=0,"HTTP",1,1460','.*OK.*',2000);
		res = await this.serialIO.sendAndExpect( 'AT+KCNXPROFILE=1','.*OK.*',2000);
		res = await this.serialIO.sendAndExpect( 'AT+KHTTPCFG=1,"https://suitcase-api.cloud.tseiman.de",443,2','.*KHTTP_IND: *[0-9]+,1',10000);

		this.httpSessionID = parseInt(res.data.match(/.*KHTTP_IND: *([0-9]+),.*/)[1]);

		this.logger.system("extracted HTTPS session ID: " + this.httpSessionID);
		res = await this.serialIO.sendAndExpect( 'AT+KHTTPGET=' + this.httpSessionID + ',"/suitcase?id=' + this.config.getValue("flightbooking-id") + '"','.*KHTTP_IND: *' + this.httpSessionID + ',.*',2000);

console.log(res);
		res = await this.serialIO.sendAndExpect( 'AT+KHTTPCLOSE=' + this.httpSessionID ,'(.*OK.*|.*CME ERROR:.*)',2000);
		res = await this.serialIO.sendAndExpect( 'AT+KHTTPDEL=' + this.httpSessionID ,'(.*OK.*|.*CME ERROR:.*)',2000);
	}

	async connectTCP() {
		var res;
		if(this.config.getValue('use-cert') === 'true') {
			res = await this.serialIO.sendAndExpect( 'AT+KTCPCFG=1,3,"' + this.config.getValue('google-mqtt-server') + '",' + this.config.getValue('google-mqtt-server-port') + ',,,,,1','.*KTCPCFG: *[0-9]+.*',12000);
		} else {
			res = await this.serialIO.sendAndExpect( 'AT+KTCPCFG=1,0,"' + this.config.getValue('google-mqtt-server') + '",' + this.config.getValue('google-mqtt-server-port') + ',,,,,1','.*KTCPCFG: *[0-9]+.*',12000);
		}

		this.tcpSessionID = parseInt(res.data.match(/.*KTCPCFG: *([0-9]+).*/)[1]);
		this.logger.system("extracted TCP session ID: " + this.tcpSessionID);
		res = await this.serialIO.sendAndExpect( 'AT+KTCPCNX=' + this.tcpSessionID ,'.*KTCP_IND: *' + this.tcpSessionID + ',1.*',10000);
	}


	async connectMQTT() {
		var mqttMsg = await this.thismqttClient.getConnectMsg();
		window.mqttMsg = mqttMsg;
		var mqttBuffer = await buffer.Buffer.from(mqttMsg.msg);
		var buffSeq = await [mqttBuffer, buffer.Buffer.from("--EOF--Pattern--")];
		var finalBuffer = await buffer.Buffer.concat(buffSeq);

		this.logger.info("Sending CONNECT: \n" + SimpleMQTT.buf2hex(finalBuffer),  true);
		var res = await this.serialIO.sendAndExpect( 'AT+KTCPSND=' + this.tcpSessionID + ',' + mqttBuffer.length,'.*CONNECT.*',5000);
		res = await this.serialIO.sendAndExpect( finalBuffer,'.*OK.*',2000, {noNewLine: true});

		var mqttInMsg = await this.waitForTCPRec(function(mqtt) {
		 	return (mqtt.type === 'ACK');
		},2000);
		
//		console.log("Here is the MQTT message - finally: ", mqttInMsg);
// ------ here the original part starts
	//	res = await this.serialIO.sendAndExpect( finalBuffer,'.*KTCP_DATA: *' + this.tcpSessionID +',[0-9]+.*',2000, {noNewLine: true});

	//	var recLen = parseInt(res.data.match(/.*KTCP_DATA: *[0-9]+,([0-9]+).*/)[1]);
	//	this.logger.info("got : " +  recLen + " bytes in downstream");
	//	res = await this.serialIO.sendAndExpect( 'AT+KTCPRCV=' + this.tcpSessionID + ',' + recLen ,'.*--EOF--Pattern--.*',5000);

	//	var resData = buffer.Buffer.from(res.data,"ascii").slice(0,recLen);
	//	var mqttInMsg = this.thismqttClient.parseMessage(resData);
// ---- testing from here


// ------ here the original part stops

		if(mqttInMsg.ret !== 0 ) {
		   throw {mqttInMsg};
		}
		this.logger.info("Connect resonse:" + JSON.stringify(mqttInMsg));
		return mqttInMsg;
	}

	async pingMQTT() {
		var mqttPingMsg = this.thismqttClient.getPingReqMsg();

		var mqttBuffer =  buffer.Buffer.from(mqttPingMsg.msg);
		var buffSeq = [mqttBuffer, buffer.Buffer.from("--EOF--Pattern--")];
		var finalBuffer = buffer.Buffer.concat(buffSeq);
	

		var res = await this.serialIO.sendAndExpect( 'AT+KTCPSND=' + this.tcpSessionID + ',' + (mqttPingMsg.len - 1) ,'.*CONNECT.*',5000);
		res = await this.serialIO.sendAndExpect(  finalBuffer,'.*OK.*',12000, {noNewLine: true});

		var mqttInMsg = await this.waitForTCPRec(function(mqtt) {
		 	return (mqtt.type === 'PONG');
		},2000);

		this.logger.info("Ping resonse:" +  JSON.stringify(mqttInMsg));

	}


	async subscribeMQTT(topic) {

		var mqttMsg = await this.thismqttClient.getSubscribeMsg(topic);
		var mqttBuffer = await buffer.Buffer.from(mqttMsg.msg);
		var buffSeq = await [mqttBuffer, buffer.Buffer.from("--EOF--Pattern--")];
		var finalBuffer = await buffer.Buffer.concat(buffSeq);

		this.logger.info("Sending SUBSCRIBE: \n" + SimpleMQTT.buf2hex(finalBuffer),  true);
		var res = await this.serialIO.sendAndExpect( 'AT+KTCPSND=' + this.tcpSessionID + ',' + mqttBuffer.length,'.*CONNECT.*',5000);
		res = await this.serialIO.sendAndExpect( finalBuffer,'.*OK.*',2000, {noNewLine: true});

		var mqttInMsg = await this.waitForTCPRec(function(mqtt) {
		 	return (mqtt.type === 'SUBSCRIBE_ACK');
		},2000);

		this.logger.info("Subscribe resonse:" + JSON.stringify(mqttInMsg));
		return mqttInMsg;



//		var res = await this.serialIO.sendAndExpect( 'AT+KTCPSND=' + this.tcpSessionID + ',' + mqttMsg.len + '\r','.*CONNECT.*',5000);
//		res = await this.serialIO.sendAndExpect( buffer.Buffer.concat([mqttMsg.msg, buffer.Buffer.from('--EOF--Pattern--','ascii')]),'.*OK.*',2000,  {noNewLine: true});
// console.log(res);
	//	var recLen = parseInt(res.data.match(/.*KTCP_DATA: *[0-9]+,([0-9]+).*/)[1]); 
	//	this.logger.info("got : " +  recLen + " bytes in downstream");
//		res = await this.serialIO.sendAndExpect( 'AT+KTCPRCV=' + this.tcpSessionID + ',' + recLen ,'.*--EOF--Pattern--.*',5000);

//		var resData = buffer.Buffer.from(res.data,"ascii"); //.slice(0,recLen);
//		var mqttInMsg = this.thismqttClient.parseMessage(resData);


	}

	async publishMQTT(topic, data) {
		var mqttMsg = this.thismqttClient.getPublishMsg(topic, JSON.stringify(data));
		this.logger.info("Sending PUBLISH: " + SimpleMQTT.buf2hex(mqttMsg.msg));

	
		var res = await this.serialIO.sendAndExpect( 'AT+KTCPSND=' + this.tcpSessionID + ',' + mqttMsg.len + '\r','.*CONNECT.*',5000);
		res = await this.serialIO.sendAndExpect( buffer.Buffer.concat([mqttMsg.msg, buffer.Buffer.from('--EOF--Pattern--','ascii')]),'.*OK.*',2000,  {noNewLine: true});
	}

	async disconnectMQTT() {
		var mqttDisconnectMsg = this.thismqttClient.getDisconnectMsg();

		var mqttBuffer =  buffer.Buffer.from(mqttDisconnectMsg.msg);
		var buffSeq = [mqttBuffer, buffer.Buffer.from("--EOF--Pattern--")];
		var finalBuffer = buffer.Buffer.concat(buffSeq);
	
		this.logger.info("Sending DISCONNECT: \n" + SimpleMQTT.buf2hex(finalBuffer),true);

		var res = await this.serialIO.sendAndExpect( 'AT+KTCPSND=' + this.tcpSessionID + ',' + (mqttDisconnectMsg.len - 1) ,'.*CONNECT.*',5000);
		res = await this.serialIO.sendAndExpect(  finalBuffer,'.*KTCP_NOTIF: *' + this.tcpSessionID + ',4.*',5000, {noNewLine: true});
	}

	async disconnectTCP() {
   		await this.serialIO.sendAndExpect('AT+KTCPCLOSE=' + this.tcpSessionID,'.*',2000).catch((err) => { this.logger.warn(err);});
    	await this.serialIO.sendAndExpect('AT+KTCPDEL=' + this.tcpSessionID ,'.*',2000).catch((err) => { this.logger.warn(err);});
	}
	async cleanup() {

    	await this.serialIO.sendAndExpect( 'ATE1','.*',2000).catch((err) => { this.logger.warn(err);});
	}

	async gnssPoll() {

		var gnssData = {};

		var res = await this.serialIO.sendAndExpect( 'AT+CFUN=0','.*OK.*',22000);
		res = await this.serialIO.sendAndExpect( 'AT+GNSSSTART=0','.*GNSSEV: *3,3',180000);
		res = await this.serialIO.sendAndExpect( 'AT+GNSSLOC?','.*OK.*',5000);
		
		var gnssData = GNSSHelper.hl78GnssToJSON(res.recordedLines);

		res = await this.serialIO.sendAndExpect( 'AT+GNSSSTOP','.*OK.*',2000);
		res = await this.serialIO.sendAndExpect( 'AT+CFUN=1','.*OK.*',12000);
		return gnssData;
	}


}
export { ATProcedures };

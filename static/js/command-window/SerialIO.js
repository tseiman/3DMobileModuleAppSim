'use strict';

import { Logger } from '/js/static/command-window/Logger.js';
/*
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')
const SimpleMQTT       	= require('./superSimpleMqttClient.js');
*/


class LineBreakTransformer {
  constructor() {
    // A container for holding stream data until a new line.
    this.chunks = "";
  }

  transform(chunk, controller) {
    // Append new chunks to existing chunks.
    this.chunks += chunk;
    // For each line breaks in chunks, send the parsed lines out.
    const lines = this.chunks.split("\r\n");
    this.chunks = lines.pop();
    lines.forEach((line) => controller.enqueue(line));
  }

  flush(controller) {
    // When the stream is closed, flush any remaining chunks out.
    controller.enqueue(this.chunks);
  }
}



class SerialIO {



	constructor(config,logger,modemAliveCB) {
		var that = this;
		this.config  =  config;
		this.callback = new Map();
		this.timeOHandler = null; 

		this.logger = logger;
		this.encoder = new TextEncoder();
		this.modemAliveCB = modemAliveCB;

	/*	this.mqttClient = new SimpleMQTT({
		    "clientID": 0, 
		    "username": "ignored",  
		    "password": "",
		    "projectId" : 0,
		    "privateKeyFile" : "./google-keys/rsa_private.pem"
		});
*/
// console.log(navigator);
// console.log(navigator.serial);


		navigator.serial.addEventListener("connect", (event) => {
			that.logger.system("UART connect: " + JSON.stringify(event));
			if(that.config.connectCallback) {
				that.config.connectCallback();
			}
		});
		
		navigator.serial.addEventListener("disconnect", (event) => {
			that.logger.system("UART DISconnect: " + JSON.stringify(event));
			if(that.config.disconnectCallback) {
				that.config.disconnectCallback();
			}
		});
		
	}



	async allocatePortDialog() {
		 this.port = await navigator.serial.requestPort();
		 this.port.onconnect = function(e) {
		 	that.logger.system("UART port direct connect: " + JSON.stringify(e));
		 }
		 this.port.disconnect = function(e) {
		 	that.logger.system("UART port direct disconnect: " + JSON.stringify(e));
		 }
	}

	async open() {
		this.logger.system(`opening UART with ${this.config.baudRate} Baud`);
		await this.port.open({ baudRate: this.config.baudRate });
		//this.writer = this.port.writable.getWriter();
		window.serial = this;
	}
	async close() {
		this.logger.system("Removing UARTS");
		await this.port.close();
		if ("serial" in navigator && "forget" in SerialPort.prototype) {
			await this.port.forget();
		} else {
			this.logger.warn("cant remove UARTS");
		}

	}

	async run() {
		var that = this;
		while (this.port.readable) {


		//	const textDecoder = new TextDecoderStream();
		//	const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
		//	const reader = textDecoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer())).getReader();
			const reader = this.port.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new TransformStream(new LineBreakTransformer())).getReader();

	//	  const reader = this.port.readable.getReader();
		  	try {
			    while (true) {
			      	const { value, done } = await reader.read();
			      	if (done) {
			        	// |reader| has been canceled.
			        	reader.releaseLock();
			        	break;
			      	}
		      		// if(value !== '') 
      				that.logger.rx(`<<< ${value}`);
		      		if(that.modemAliveCB) {
								that.modemAliveCB();
							}

		      		that.triggerCallbacks(value);

			      // Do something with |value|...
			    }
		  	} catch (error) {
		  		console.error(error);
		    	this.logger.warn(error);// Handle |error|...
		  	} finally {
		    	reader.releaseLock();
		  	}
		}
	}

	async sendln(data) {
		await this.send(data + this.config.lineDelimiter);
	}
	async send(data) {
		this.logger.tx(`>>> ${data}`);
		const writer = this.port.writable.getWriter();
		await writer.write(this.encoder.encode(data));
		writer.releaseLock();
	/*	await this.writer.write(new TextEncoder().encode(data));
		this.writer.releaseLock(); */
	}

	registerCallback(name,expect,callback,callbackObj) {
		if(name in this.callback) {
			console.warn("Callback with thename " + name + " exists already. Callback ignored !!!");
			return;
		}
			console.log("setting callback with name: \"" + name + "\" and expect:\"" + expect +"\n");
	    this.callback.set(name, {'name': name, 're': new RegExp(expect), 'expect': expect, 'callback':  callback, 'callbackObj': callbackObj});
	}


	triggerCallbacks(data) {
		// console.log("callback", data);
		if(this.callback.size === 0) {
		//	console.warn("No callbacks defined");
			return;
		}
		var self = this;
		this.callback.forEach(function (callback) {
	//		console.log("we're on callback", callback);
			if (callback.re.test(data)) { 
		//		console.log("Matching callback found for RegEx:\"" + callback.expect +"\" - calling:\"" + callback.name + "\"");
				callback.callback(data,callback.callbackObj);

			}
		});
	}

	removeCallback(name) {
		if(this.callback.size === 0) {
			console.warn("NO Callback defined can't destroy");
			return;
		}
		if(! this.callback.has(name)) {
			console.error("Callback \"" + name + "\" is not defined, nothing removed !");
			return;
		}
		console.log("removing callback \"" + name + "\"");
		this.callback.delete(name);
	}


	waitResponseClearTimeOut() {
		console.warn("Cleaning up sendAndExpect response timer ! (this is a potential dangerous operation)");
		clearTimeout(this.timeOHandler);
	}
	sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
	}

	async sendAndExpect(cmd,expect,timeout,noNewLine) {
			await this.sleep(100);
	    if(typeof noNewLine !== 'undefined' && noNewLine ) {
				console.log("sending without delimter"+  typeof cmd);
				this.send(cmd);
	    } else { 
				this.sendln(cmd);
	    }
	    return this.waitResponse(expect,timeout);
	}


	waitResponse(expect,timeout) {
	  console.log("wait for: " + expect);
	  var self = this;
	  return new Promise(function(resolve, reject) {
		// var timeOHandler = this.;
			if(timeout !== undefined) { 
	      self.timeOHandler = setTimeout(function() { 
					console.warn("Timeout after " + timeout +"ms waiting for " + expect);
					self.removeCallback("synchron.waitResponse");
						reject({data: "timeout", result: false}); 
			  }, timeout);
			}
			self.registerCallback ( "synchron.waitResponse",expect, function (data) { 
//		    	var re = new RegExp(expect);    
//		    	if (re.test(data)) {
				console.log("found expected Data");
				clearTimeout(self.timeOHandler);
				self.removeCallback("synchron.waitResponse");
  			resolve({result: true, "data": data});
//		    	}  

			}); 
	  }); 
	}



}
export { SerialIO };

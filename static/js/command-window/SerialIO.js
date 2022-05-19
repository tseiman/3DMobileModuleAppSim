'use strict';

import { Logger } from '/js/static/command-window/Logger.js';

import { SimpleMQTT } from '/js/static/command-window/SuperSimpleMqttClient.js';
/*
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline')
const SimpleMQTT       	= require('./superSimpleMqttClient.js');
*/


class LineBreakTransformer {
  constructor() {
    // A container for holding stream data until a new line.
//    this.chunks = "";
this.chunks = buffer.Buffer.from("")
    	// this.chunks = [buffer.Buffer.from("")];
  }
/*

split(a) {

	console.log("Split gets:", a);
    var result = [];
    var currentToken = [];
    for (var i = 0; i < a.length; i++) {
        console.log(a[i]);
        if (a[i] === 13 && a[i + 1] === 10 ) {
            if (currentToken.length !== 0)
                result.push(currentToken);
            currentToken = []; // clear array
        } else if(a[i -1] === 13 && a[i] === 10 ) {
        	continue;
// do nothing 
        } else {
            currentToken.push(String.fromCharCode(a[i]));
        }
    }
    if (currentToken.length !== 0)
        result.push(currentToken);
console.log("Split returns:", result);
    return result;
	}


  transform(chunk, controller) {
//  	this.chunks = buffer.Buffer.concat([this.chunks, buffer.Buffer.from(chunk)]);

    // Append new chunks to existing chunks.
 //   this.chunks += chunk;
console.log(this.chunks, buffer.Buffer.from(chunk));
 		this.chunks = buffer.Buffer.concat([buffer.Buffer.from(this.chunks), buffer.Buffer.from(chunk)]);
window.chunks = this.chunks;
    // For each line breaks in chunks, send the parsed lines out.
 //   const lines = this.chunks.split("\r\n");
 		const lines = this.split(this.chunks);
    this.chunks = lines.pop();
    console.log("Lines ---->" + lines.length, this.chunks, lines);
    lines.forEach((line) => controller.enqueue(line));


  }
  	*/


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
window.LineBreakTransformer = LineBreakTransformer;


class SerialIO {



	constructor(config,logger,modemAliveCB) {
		var that = this;
		this.config  =  config;
		this.callback = new Map();
		this.timeOHandler = null; 
		this.ksleepEnable = false;
		this.ksleepTimer = null;
		this.ksleepTimerTime = 5000;
		this.dtrState = true;


		this.logger = logger;
		this.encoder = new TextEncoder();
		this.outputStream = this.encoder.writable;

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
		var that = this;
		this.logger.system(`opening UART with ${this.config.baudRate} Baud`);
		await this.port.open({ baudRate: this.config.baudRate });
		this.setDTR(true, that);
		//this.writer = this.port.writable.getWriter();
		window.serial = this;
	}
	async close() {
		this.logger.system("Removing UARTS");
		this.port.writable.getWriter().releaseLock();
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
			const reader = this.port.readable.pipeThrough(new TextDecoderStream('ascii')).pipeThrough(new TransformStream(new LineBreakTransformer())).getReader();

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
      			//	console.log(SimpleMQTT.buf2hex(value));
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
		if(typeof data === 'string') {
			data = data + this.config.lineDelimiter;
			data = new buffer.Buffer(data);
		} else {
			data = await buffer.Buffer.concat([data,buffer.Buffer.from(this.config.lineDelimiter)]);
		}
		await this.send(data );
	}

	async send(data) {
		var that = this;
		await this.setDTR(true, that);
		if(this.ksleepEnable) {
			clearTimeout(this.ksleepTimer);
			this.ksleepTimer = null;
		}

		if(typeof data === 'string') {
			data = new buffer.Buffer(data);
		} 

		this.logger.tx(`>>> ${data}`);
		const writer = this.port.writable.getWriter();
		await writer.write(data);
		writer.releaseLock();

		if(this.ksleepEnable) {
			clearTimeout(this.ksleepTimer);
			this.ksleepTimer = setTimeout(() => { that.setDTR(false,that); }, that.ksleepTimerTime);
		}
	}

	registerCallback(name,expect,callback,callbackObj) {
		if(name in this.callback) {
			console.warn("Callback with the name " + name + " exists already. Callback ignored !!!");
			return;
		}
	//		console.log("setting callback with name: \"" + name + "\" and expect:\"" + expect +"\n");
	    this.callback.set(name, {'name': name, 're': new RegExp(expect), 'expect': expect, 'callback':  callback, 'callbackObj': callbackObj, 'recordedLines': [] });
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
				callback.callback(data,callback.callbackObj,callback.recordedLines);

			} else {
				callback.recordedLines.push(data);
			}
		});
	}

	removeCallback(name) {
		if(this.callback.size === 0) {
			console.warn("NO Callback defined can't destroy");
			return;
		}
		if(! this.callback.has(name)) {
			console.warn("Callback \"" + name + "\" is not defined, nothing removed !");
			return;
		}
	//	console.log("removing callback \"" + name + "\"");
		this.callback.delete(name);
	}


	waitResponseClearTimeOut() {
		console.warn("Cleaning up sendAndExpect response timer ! (this is a potential dangerous operation)");
		clearTimeout(this.timeOHandler);
	}
	sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
	}

	async sendAndExpect(cmd,expect,timeout,options) {
			var noNewLine = false;

			if(options) {
				if(options.noNewLine) noNewLine = true;
			}

			if(typeof cmd === 'string') {
				cmd = new buffer.Buffer(cmd);
			} 
			await this.sleep(10);
	    if(typeof noNewLine !== 'undefined' && noNewLine ) {
				this.send(cmd);
	    } else { 
				this.sendln(cmd);
	    }
	    return this.waitResponse(expect,timeout);
	}


	waitResponse(expect,timeout) {
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
			self.registerCallback ( "synchron.waitResponse",expect, function (data, callbackObj, recordedLines) { 
				clearTimeout(self.timeOHandler);
				self.removeCallback("synchron.waitResponse");
  			resolve({result: true, "data": data, "recordedLines" : recordedLines});
			}); 
	  }); 
	}

	async setDTR(enable,that) {
		that.port.setSignals({ dataTerminalReady: enable });
		if(that.dtrState !== enable) await new Promise(resolve => setTimeout(resolve, 100));
		that.dtrState = enable;

	}

	enableSleepHandler(time) {
		var that = this;
		this.ksleepTimerTime = (time < 1000) ? 1000: time;
		this.ksleepEnable = true;
		this.ksleepTimer = setTimeout(() => { that.setDTR(false, that); }, this.ksleepTimerTime);

	}
	async disableSleepHandler() {
		var that = this;
		await this.setDTR(true, that);
		this.ksleepEnable = false;
		clearTimeout(this.ksleepTimer);
		this.ksleepTimer = null;

	}

}
export { SerialIO };

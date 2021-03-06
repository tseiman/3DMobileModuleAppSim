'use strict';


import * as jose from '/js/jose/index.js';
// var buffer = require("buffer");

/* conenct flags - can be combined with Binary OR */
const 	ConnectFlag_CleanSession 	= 2,
	ConnectFlag_Will 		= 4,
	ConnectFlag_QoS1 		= 8,
	ConnectFlag_QoS2 		= 16,
	ConnectFlag_QoS3 		= 24,
	ConnectFlag_WillRetain 		= 32,
	ConnectFlag_Password 		= 64,
	ConnectFlag_User 		= 128;


/*  Return codes with the related meaning mapped */
const MQTT_ReturnCodes = {
    0:	"Connection accepted",
    1:	"Connection refused, unacceptable protocol version",
    2:	"Connection refused, identifier rejected",
    3:	"Connection refused, server unavailable",
    4:	"Connection refused, bad user name or password",
    5:	"Connection refused, not authorized"
};

class SimpleMQTT {

/* *******************************
 * The constructor thaks a config JSON. 
 * At the mometn it has only one member "clientID"
 * which is the MQTT clientID
 */

    constructor(config) {
		this.config  =  config;
		this.logger = config.logger;

		if(typeof this.config.clientID === 'undefined' || this.config.clientID == null) {
		    this.config.clientID = "Unknown/client";
		}
		
		this.config.algorithm = 'RS256';

	   if(typeof this.config.privateKey === 'undefined' || this.config.privateKey == null) {
		 	this.config.privateKey = ""; //   throw "privateKey not set";
		}

	   if(typeof this.config.projectId === 'undefined' || this.config.projectId == null) {
		  this.config.projectId = ""; // throw "google projectId not set";
		}
	    


   }


/* *******************************
 * Helper method - creates a hexdump for console
 */
 	static buf2hex(inbuffer, blockSize) {
		blockSize = blockSize || 16;
      var lines = [];
		var hex = "0123456789ABCDEF";
		inbuffer = inbuffer.toString();
		for (var b = 0; b < inbuffer.length; b += blockSize) {
    		var block = inbuffer.slice(b, Math.min(b + blockSize, inbuffer.length));
    	   var addr = ("0000" + b.toString(16)).slice(-4);
    	   var codes = block.split('').map(function (ch) {
        		var code = ch.charCodeAt(0);
        		return " " + hex[(0xF0 & code) >> 4] + hex[0x0F & code];
    		}).join("");
    	   codes += "   ".repeat(blockSize - block.length);
    	   var chars = block.replace(/[\x00-\x1F\x20]/g, '.');
    	   chars +=  " ".repeat(blockSize - block.length);
    	   lines.push("\t\t\t\t " + addr + " " + codes + "  " + chars);
		}
      return lines.join("\n");
    }


/* *******************************
 * Helper method - is to dump a binary buffer into hex (to display the buffer)
 */
/*    static buf2hex(buffer) {
	return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join(' ');
    }
*/
/* *******************************
 * Helper method - encode the length information into the dynamic len field
 */

    encodeMqttMesageLen(len) {
	var lenFieldArray = [];
	do {
            var encodedByte = len % 128;
            len = Math.floor(len / 128);

	    if ( len > 0 ) {  // if there are more data to encode, set the top bit of this byte
        	encodedByte = encodedByte | 128;
            }
	    lenFieldArray.push(encodedByte);
//                    console.log(">>>>" + encodedByte.toString(16));
	}  while ( len > 0 );
	return lenFieldArray;
    }


/* *******************************
 * Helper method - converts int to binary (string)
 */

    dec2bin(dec) {
	return (dec >>> 0).toString(2);
    }


/* *******************************
 * Helper method - converts a 32bit (max) integer into a 4 byte array
 */
    toBytesInt32(num) {
	var arr = new Uint8Array([
    	    (num & 0xff000000) >> 24,
            (num & 0x00ff0000) >> 16,
            (num & 0x0000ff00) >> 8,
            (num & 0x000000ff)
	]);
	return arr;
    }


/* *******************************
 * Helper method - converts a string to a byte array
 */
    stringToByteArray(str) {
		var bytes = [];
		for (var i = 0; i < str.length; ++i) {
	    var code = str.charCodeAt(i);
	    bytes = bytes.concat([code]);
		}
	return bytes;
    }

/* ******************************
 * Runs the signature of the connect token
 */

    async createJwt() {
	  // Create a JWT to authenticate this device. The device will be disconnected
	  // after the token expires, and will have to reconnect with a new token. The
	  // audience field should always be set to the GCP project id.
		const token = {
		    iat: parseInt(Date.now() / 1000),
		    exp: parseInt(Date.now() / 1000) + 20 * 60, // 20 minutes
		    aud: this.config.projectId,
		};
		// const privateKey = fs.readFileSync(this.config.privateKeyFile);
//		return jwt.sign(token, this.config.privateKeyFile, {algorithm: this.config.algorithm});


	//	return await new jose.SignJWT(token).setProtectedHeader({ alg: 'ES256' }).sign(this.config.privateKey);


		const rsPrivateKey = await jose.importPKCS8(this.config.privateKey, 'RS256')
		var signedJWT =  await new jose.SignJWT(token).setProtectedHeader({ alg: 'RS256' , typ: 'JWT' }).sign(rsPrivateKey);
		return signedJWT;

    };


/* *******************************
 * returns simply a more or less manually assembled MQTT conenct message
 */
   async getConnectMsg() {

		var connectMessageItems = [];
		var flag = ConnectFlag_CleanSession;

		connectMessageItems.push({'len': this.config.clientID.length, 'value': this.config.clientID});
		console.log("connectMessageItems",connectMessageItems);
		
		if(typeof this.config.username !== 'undefined' && this.config.username != null) {
		    flag = flag + ConnectFlag_User;
		    connectMessageItems.push({'len': this.config.username.length, 'value': this.config.username});

		}
		if(typeof this.config.password !== 'undefined' && this.config.password != null) {
		    flag = flag + ConnectFlag_Password;
		    var pw = await this.createJwt();
		    connectMessageItems.push({'len': pw.length, 'value': pw});
		}




/* --------------------------------------------------------------------------------------------------------------


                                                         Keep Alive
                                                 Connect Flag     |
                                        Protocol version    |     |
                       protocol name                   |    |     |           
       length of protocol name     |                   |    |     |
                             |     |                   |    |     |
	                          v     v  MQIsdp           |    |     v     
		       		   -------  -----------------   v    v  -------    */
//	var dataBuffer = [0x0,0x4,0x4d,0x51,0x54,0x54,0x4,flag,0x0,(this.config.keepAlive & 255)];
	var dataBuffer = [0x0,0x4,0x4d,0x51,0x54,0x54,0x4,flag,0x0,0x0];
//	var dataBuffer = [0x0,0x5,0x6d,0x71,0x74,0x74,0x73,0x4,flag,0x0,0x5];
// mqtts
	var that = this;
	connectMessageItems.forEach(function (item, index) {
	    var lenghtHiByte = that.toBytesInt32(item.len)[2];
	    dataBuffer.push(lenghtHiByte);
	    var lenghtLoByte = that.toBytesInt32(item.len)[3];
	    dataBuffer.push(lenghtLoByte);
	    dataBuffer = dataBuffer.concat(that.stringToByteArray(item.value));
	});

	var headerBuffer = [0x10]; // This is a CONNECT message
	var totalLen = dataBuffer.length;

	do {
 	   var encodedByte = totalLen % 128;
      totalLen = Math.floor(totalLen/128);

      if ( totalLen > 0 ) { // if there are more data to encode, set the top bit of this byte
           encodedByte = encodedByte | 128;
      }

   	headerBuffer.push(this.toBytesInt32(encodedByte)[3]);

   } while ( totalLen > 0 );


	var message = buffer.Buffer.concat([buffer.Buffer.from(headerBuffer),buffer.Buffer.from(dataBuffer)]);



//	var buffer = Buffer.from(headerBuffer);
// 	var buffer = Buffer.concat( [Buffer.from(headerBuffer), Buffer.from(dataBuffer)], headerBuffer.length + dataBuffer.length);

//	buffer[1] = this.toBytesInt32(buffer.length - 2)[3]; // minus message type and total length byte fields
/*	var message = new Buffer(headerBuffer.length + dataBuffer.length);
	for (var i = 0; i < headerBuffer.length; ++i) {
	    message[i] = headerBuffer[i];
	}
	for (var i = 0; i < dataBuffer.length; ++i) {
	    message[i + headerBuffer.length] = dataBuffer[i];
	}
	
*/


	return {"len" :   dataBuffer.length , "msg": message };
    }
    
/* *******************************
*/
    getPublishMsg(topic, msg) {
		var publish = 0x30;
		var topicLenHiByte = this.toBytesInt32(topic.length)[2];
		var topicLenLoByte = this.toBytesInt32(topic.length)[3];

	/* --------------------------------------------------------------
	                              topic Len
	    Total Length - will do later      |
		         PUBLISH       |      v
			       v       v  ----------------------------      */
	/*	var buffer = [publish,0x0,topicLenHiByte,topicLenLoByte]; */
	/* we merge the length aferward in as it is generated with dynamic length */
		var playloadBuffer = [publish, /* 0x0,*/ topicLenHiByte,topicLenLoByte];

		playloadBuffer = playloadBuffer.concat(this.stringToByteArray(topic));
		playloadBuffer = playloadBuffer.concat(this.stringToByteArray(msg));

	//	buffer[1] = this.toBytesInt32(buffer.length - 2)[3]; // minus message type and total length byte fields

	// console.log("----------------------------------" + (buffer.length - 1));
		var lenFieldArray = this.encodeMqttMesageLen(playloadBuffer.length - 1);  // minus message type and total length byte fields
		var mergePos = 1;
		lenFieldArray.forEach(lenByte => {
		    playloadBuffer.splice(mergePos, 0, this.toBytesInt32(lenByte)[3]);
		    ++mergePos;
		});
		
		var message = buffer.Buffer.alloc(playloadBuffer.length,"ascii");
		for (var i = 0; i < playloadBuffer.length; ++i) {
		    message[i] = playloadBuffer[i];
		}
		

		return {"len" : playloadBuffer.length, "msg": message };
	
    }

/* *******************************
*/
    getSubscribeMsg(topic) {
		var subscribe = 0x82;
		var topicLenHiByte = this.toBytesInt32(topic.length)[2];
		var topicLenLoByte = this.toBytesInt32(topic.length)[3];

	/* --------------------------------------------------------------
                                      len   packet ID
								   message ID  |   -----------
                               v       v    v   v    */
		var playloadBuffer = [subscribe,0x0,0x01,topicLenHiByte,topicLenLoByte];

		playloadBuffer = playloadBuffer.concat(this.stringToByteArray(topic));
		playloadBuffer = playloadBuffer.concat(0x00); // fire and forget

		var lenFieldArray = this.encodeMqttMesageLen(playloadBuffer.length - 1);  // minus message type and total length byte fields
		var mergePos = 1;
		lenFieldArray.forEach(lenByte => {
		    playloadBuffer.splice(mergePos, 0, this.toBytesInt32(lenByte)[3]);
		    ++mergePos;
		});

	//	playloadBuffer[1] = this.toBytesInt32(playloadBuffer - 2 ); // minus message type and total length byte fields

		var message = buffer.Buffer.alloc(playloadBuffer.length,"ascii");
		for (var i = 0; i < playloadBuffer.length; ++i) {
		    message[i] = playloadBuffer[i];
		}

		return {"len" : playloadBuffer.length, "msg": message };
	
    }

/* *******************************
*/
   getPingReqMsg() {

/* --------------------------------------------------------------
         Total len = 0      |
	            PING    |
		       v    v    */
	var payloadBuffer = [0xc0,0x0];
//	var buffer = [0xab,0xcd];

		var message = buffer.Buffer.alloc(payloadBuffer.length,"ascii");
		for (var i = 0; i < payloadBuffer.length; ++i) {
	   	 message[i] = payloadBuffer[i];
		}
	

	return {"len" : payloadBuffer.length, "msg": message };
	
   }

/* *******************************
*/
   getDisconnectMsg() {

/* --------------------------------------------------------------
         Total len = 0  	|
	            PING   |		|
		      			 v    v    */
		var payloadBuffer = [0xe0,0x0];

		var message = buffer.Buffer.alloc(payloadBuffer.length,"ascii");
		for (var i = 0; i < payloadBuffer.length; ++i) {
	    	message[i] = payloadBuffer[i];
		}
		return {"len" : payloadBuffer.length, "msg": message };
	
   }


/* *******************************
*/
 decodePublish(payloadBuffer) {
//   	var length = payloadBuffer[1];
   	var remainingLengthBytesCount = 0;


 		var multiplier = 1;
      var totalLen = 0
      do {
            var encodedByte = payloadBuffer[remainingLengthBytesCount + 1];
         // console.log("encodedByte" + encodedByte.toString(16));
            totalLen += (encodedByte & 127) * multiplier;
            multiplier *= 128;
            ++remainingLengthBytesCount;
            if (multiplier > (128*128*128)) { throw("Malformed Remaining Length"); }
      } while ((encodedByte & 128) != 0);
      var lengthFieldLen = remainingLengthBytesCount;

      var highByteTopicLen = payloadBuffer[remainingLengthBytesCount + 1]; console.log("encodedByte:" + highByteTopicLen.toString(16));
      var lowByteTopicLen = payloadBuffer[remainingLengthBytesCount + 2];console.log("encodedByte:" + lowByteTopicLen.toString(16));
      var topicLen = ((highByteTopicLen & 0xff) << 8) + (lowByteTopicLen & 0xff);
      var topic ="";
      for(var i = 0; i < topicLen; ++i) {
          topic += String.fromCharCode(payloadBuffer[remainingLengthBytesCount + 3]);
          ++remainingLengthBytesCount;
      }
      console.log(totalLen, topicLen , lengthFieldLen);
      var msg = "";
      for(var i = 0; i < (totalLen - topicLen -lengthFieldLen  ); ++i) {
          msg += String.fromCharCode(payloadBuffer[remainingLengthBytesCount + 3]);
          ++remainingLengthBytesCount;
      }
   //   console.log("decodePublish", msg);

      return {'topic': topic, 'msg' : msg};

   }
/* *******************************
*/
 decodePublishBadHack(payloadBuffer) { // This is a really bad hack which does not really encode the MQTT packet as there is an issue with the Unicode encoding of the buffer
 													// instead of relally encoding thei is just grabbing the conent with illegal assumptions - CRAZY Unicode handling in JS
//   	var length = payloadBuffer[1];
   	var remainingLengthBytesCount = 0;

   	const REG_PATTERN = /^.*(\/devices\/.+\/commands)(\{.*\})/;
		var param = REG_PATTERN.exec(payloadBuffer);
		var topic = param[1];
		var msg = param[2];
      return {'topic': topic, 'msg' : msg};

   }


/* *******************************
 * This takes an incomming message and checks what kind of message it is.
 * The methos returns a JSOn structure with the return code and the message type
 * An error message  might be additionally additionally with it's String error message
 */
   parseMessage(msg) {
		var res= {};

		console.log(SimpleMQTT.buf2hex(buffer.Buffer.from(msg)));
		// this.stringToByteArray(msg);

		var payloadBuffer =  buffer.Buffer.from(msg);

		// var buffer = this.stringToByteArray(msg);
		this.logger.info("Incomming message: \n" + SimpleMQTT.buf2hex(payloadBuffer) + ", msg code:" + payloadBuffer[0]);

		if(payloadBuffer[0] == 0x20) {
	   	res.type = "ACK"; // yes- this is a very very basic implementation and needs more
	    	var mqttRet = parseInt(payloadBuffer[3]);
	    	res.ret = mqttRet;
	    	res.retMsg = MQTT_ReturnCodes[mqttRet];
		} else if(payloadBuffer[0] == 0xD0) { // !!!!!!!! Normally this should be 0x0D ! - but I have here some massive recoding issue !! therefore this is a terrible Hack
	   	res.type = "PONG";
	    	res.ret = null;
	    	res.retMsg = null;
	   } else if(payloadBuffer[0] == 0x90) { // !!!!!!!! Normally this should be 0x0D ! - but I have here some massive recoding issue !! therefore this is a terrible Hack
	   	res.type = "SUBSCRIBE_ACK";
	    	res.ret = null;
	    	res.retMsg = null;
		} else if(payloadBuffer[0] >= 0x30 && payloadBuffer[0] <= 0x3F) {
	   	res.type = "PUBLISH";
	    	res.ret = null;
	    	res.retMsg = this.decodePublishBadHack(payloadBuffer);
		} else {
			console.log("Unknown message type:" + payloadBuffer[0].toString(16));
	   	res.type = "UNKNOWN";
	    	res.ret = null;
	    	res.retMsg = null;
		}
		return res;
   }

}
export { SimpleMQTT };


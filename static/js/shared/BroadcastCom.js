class BroadcastCom {


	constructor(myName, logger) {
		var that = this;

		this.logger = logger;
		this.myName = myName;

		this.bcChannel = new BroadcastChannel('sierrademo.link');


		this.listeners = new Map();

		this.bcChannel.onmessage = function(msg) {
			if(msg.data.dest !== that.myName) return;
			if(that.listeners.size === 0) return;
			
			that.listeners.forEach(function (callback) {
				callback.callback(msg.data, callback.self);
			}); 
		} 

	}

	sendData(destination,data) {
		this.logger.log("sending data via Broadcast Channel :", {'dest': destination, 'data': data});
		this.bcChannel.postMessage({'dest': destination, 'data': data});
	}


	registerListener(name, callback, self) {
		if(name in this.listeners) {
			console.warn("BroadcastCom listener with the name " + name + " exists already. Callback ignored !!!");
			return;
		}
	    this.listeners.set(name, {'name': name, 'callback':  callback, 'self': self });
	}

	removeTcpMqttRecHandler(name) {
		if(this.listeners.size === 0) {
			console.warn("NO BroadcastCom listener defined - can't destroy");
			return;
		}
		if(! this.listeners.has(name)) {
			console.error("BroadcastCom listener \"" + name + "\" is not defined, nothing removed !");
			return;
		}
		this.listeners.delete(name);
	}

	

}
export { BroadcastCom };
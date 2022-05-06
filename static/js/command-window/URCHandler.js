
class URCHandler {


	constructor(logger) {
		this.logger = logger;
		this.callback = new Map();
	}

	registerURCHandler(name, expect, callback, callbackObj) {
		if(name in this.callback) {
			console.warn("URC Callback with the name " + name + " exists already. Callback ignored !!!");
			return;
		}
		console.log("setting callback with name: \"" + name + "\" and expect:\"" + expect +"\n");
	    this.callback.set(name, {'name': name, 're': new RegExp(expect), 'expect': expect, 'callback':  callback, 'callbackObj': callbackObj});
	}

	handleURC(data,obj) {
		var that = obj;
	//	 console.log("URC callback", data, that.constructor.name);
		 window.xyz = that;
		if(that.callback.size === 0) {
		//	console.warn("No callbacks defined");
			return;
		}

		that.callback.forEach(function (callback) {
	//		console.log("we're on callback", callback);
			if (callback.re.test(data)) { 
	//			console.log("Matching URC callback found for RegEx:\"" + callback.expect +"\" - calling:\"" + callback.name + "\"");
				callback.callback(data, callback.callbackObj);
			}
		});
	}

}
export { URCHandler };


const EMETER_MEASSURE_CYCLE = 1000;

class EMeterController {
	constructor (scene) {
		this.scene = scene;
		this.deviceRegistry = {};
	 	this.meterProc = null;
	 	this.power = 0;

	 	let consumption = window.localStorage.getItem("electricitymeter-consumption");
	 	this.consumption =  (parseFloat(consumption) !== 'NaN') ? parseFloat(consumption) : 0;


	}


	registerDevice(device) {
		console.log("registerDevice" + JSON.stringify(device));
		this.deviceRegistry[device.name] = device;
		this.deviceRegistry[device.name].uiObject = this.scene.getObjectByName(device.name);

	}

	toggleDevicePower(deviceName) {
		let dev = this.deviceRegistry[deviceName];
		dev.state = !dev.state;
		dev.uiObject.visible = dev.state;
	}
	
	_toFixedIfNecessary( value, dp ){
  	return +parseFloat(value).toFixed( dp );
	}

	_meterProcess() {
		var curPower = 0;		
		for(var device in this.deviceRegistry){ 
	//		this.deviceRegistry[device]
			if(this.deviceRegistry[device].state) {
				curPower += this.deviceRegistry[device].power;
			}
		} 
		this.power = curPower;
		this.consumption += curPower / (3600000 / EMETER_MEASSURE_CYCLE);
		window.localStorage.setItem("electricitymeter-consumption", this.consumption);
		$('#powermeter').text(`Current Power: ${Math.round(this.power)}W`);
		$('#consumption').text(`Consumption: ${this._toFixedIfNecessary(this.consumption / 1000,4)}kWh`);
	}

	startMeter() {
		this.meterProc = setInterval(() => this._meterProcess(), EMETER_MEASSURE_CYCLE);
	}
	stopMeter() {
		 if(this.meterProc !== null) clearInterval(this.meterProc);
		 this.meterProc = null;
	}

	toString() {
		return JSON.stringify(this.deviceRegistry,null,2);
	}
}
export { EMeterController };

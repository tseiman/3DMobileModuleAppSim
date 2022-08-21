
const EMETER_MEASSURE_CYCLE = 1000;

class EMeterController {
	constructor (scene) {
		this.scene = scene;
		this.deviceRegistry = {};
	 	this.meterProc = null;
	 	this.power = 0;

	 	let consumption = window.localStorage.getItem("electricitymeter-consumption");
	 	this.consumption =  isNaN(parseFloat(consumption)) ? 0 : parseFloat(consumption);


	}


	registerDevice(device) {
		console.log("registerDevice" + JSON.stringify(device));
		this.deviceRegistry[device.name] = device;
		this.deviceRegistry[device.name].uiObject = this.scene.getObjectByName(device.name);

	}

	toggleDevicePower(deviceName) {
		let dev = this.deviceRegistry[deviceName];
		dev.state = !dev.state;

		if(dev.type==='light') dev.uiObject.visible = dev.state;
		if(dev.state) {
			console.log("switch on " + "#label_" + dev.name );
			$( "#label_" + dev.name ).find("i").removeClass( "switch-offstate" ).addClass( "switch-onstate" );
		} else {
			console.log("switch off " + "#label_" + dev.name );
			$( "#label_" + dev.name ).find("i").removeClass( "switch-onstate" ).addClass( "switch-offstate" );
		}
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

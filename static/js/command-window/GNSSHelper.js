class GNSSHelper { 


	static hl78GnssToJSON(arrayObj) {

		var gnssData = {};
		var gnssLocStr = "";

		arrayObj.forEach(element => {
			gnssLocStr += element + "\n";
		});

		var lat = gnssLocStr.match(/.*Latitude: *(.*)\n/)[1];
		if(!lat || lat === "") return null;
		lat = lat.match(/^ *([0-9]+) *Deg *([0-9]+) *Min *([.0-9]+) *Sec *(N|S)/);
		var decLat = parseInt(lat[1]) + (parseInt(lat[2]) / 60) + (parseFloat(lat[3]) / 3600);
		if(lat[4] === 'S') decLat = decLat * (-1);

		var lon = gnssLocStr.match(/.*Longitude: *(.*)\n/)[1];
		if(!lon || lon === "") return null;

		lon = lon.match(/^ *([0-9]+) *Deg *([0-9]+) *Min *([.0-9]+) *Sec *(W|E)/);
		var decLon = parseInt(lon[1]) + (parseInt(lon[2]) / 60) + (parseFloat(lon[3]) / 3600);
		if(lon[4] === 'W') decLon = decLon * (-1);

		gnssData.lat 		= decLat;		
		gnssData.lon 		= decLon;
		gnssData.gpstime 	= gnssLocStr.match(/.*GpsTime: *(.*)\n/)[1];
		gnssData.fixtype 	= gnssLocStr.match(/.*FixType: *(.*)\n/)[1];
		gnssData.HEPE 		= gnssLocStr.match(/.*HEPE: *(.*)\n/)[1];
		gnssData.Altitude 	= gnssLocStr.match(/.*Altitude: *(.*)\n/)[1];
		gnssData.AltUnc 	= gnssLocStr.match(/.*AltUnc: *(.*)\n/)[1];
		gnssData.Direction 	= gnssLocStr.match(/.*Direction: *(.*)\n/)[1];
		gnssData.HorSpeed 	= gnssLocStr.match(/.*HorSpeed: *(.*)\n/)[1];
		gnssData.VerSpeed 	= gnssLocStr.match(/.*VerSpeed: *(.*)\n/)[1];

		return gnssData;

	}


	static getDefaultGNSSObj() {
		var gnssData = {};
		
		var now = moment(new Date() - 2*3600000);
		var formatted = now.format('YYYY MM DD HH:mm:ss');

		gnssData.lat 		= "49.283719";		
		gnssData.lon 		= "-123.120994";
		gnssData.gpstime 	= formatted;
		gnssData.fixtype 	= "3D";
		gnssData.HEPE 		= "0.09 m";
		gnssData.Altitude 	= "10 m";
		gnssData.AltUnc 	= "0.0 m";
		gnssData.Direction 	= "";
		gnssData.HorSpeed 	= "";
		gnssData.VerSpeed 	= "";

		return gnssData;
	}
}
export { GNSSHelper };
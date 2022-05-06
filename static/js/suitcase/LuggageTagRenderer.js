'use strict';

class LuggageTagRenderer {


	constructor(config) {
		var that = this;
		this.name = config.name;
		this.barcodeString = config.barcodeString;
		this.flightWeight = config.flightWeight;
		this.flightNo = config.flightNo;
		this.passengerName = config.passengerName;
		this.destinationShort = config.destinationShort;
		this.destinationLong = config.destinationLong;
		this.destinationInfo1 = config.destinationInfo1;
		this.destinationInfo2 = config.destinationInfo2;
		this.backgroudImage = config.backgroudImage;
		this.callback = config.callback;

		$("body").append(`
			<canvas id="${that.name}-baggageTag-canvas" width="600" height="600" style="display: none;"></canvas>
			<canvas id="${that.name}-baggageTag-canvas-barcode" width="600" height="100" style="display: none;" ></canvas>
		`);

   		var canvasBackgroundImage = new Image() ;

		// var barcodeString = new Date().valueOf();// "20220506013812";
		
		var barcode = JsBarcode(`#${that.name}-baggageTag-canvas-barcode`, that.barcodeString, {});
		window.bc = barcode;

			that.baggageTagCanvas = document.getElementById(`${that.name}-baggageTag-canvas`);
			var baggageTagCtx = that.baggageTagCanvas.getContext('2d');
			canvasBackgroundImage.onload = function() {

			var xoffset = (600 - canvasBackgroundImage.width) / 2;
		    baggageTagCtx.drawImage(canvasBackgroundImage,xoffset , 0);

			baggageTagCtx.font  = "20px monospace";
			baggageTagCtx.fillStyle = "black";
			baggageTagCtx.fillText("Weight: " + that.flightWeight + "Kg", xoffset + 60, 50);
			baggageTagCtx.fillText("Final Flight No.: " + that.flightNo, xoffset + 60, 90);
			baggageTagCtx.fillText("Passenger Name: " + that.passengerName, xoffset + 60, 130);

			baggageTagCtx.font  = "20px Arial Narrow";
			baggageTagCtx.fillStyle = "black";
			baggageTagCtx.fillText("FINAL DEST.", xoffset + 60, 215);

			baggageTagCtx.font  = "120px Arial Black";
			baggageTagCtx.textAlign = "center";
			baggageTagCtx.fillStyle = "white";
			baggageTagCtx.fillText(that.destinationShort, canvasBackgroundImage.width/2 +xoffset , 350);

			baggageTagCtx.textAlign = "left";
			baggageTagCtx.font  = "26px Arial Narrow";
			baggageTagCtx.fillStyle = "black";
			baggageTagCtx.fillText(that.destinationLong, xoffset + 60, 405);


			baggageTagCtx.font  = "18px Arial Narrow";
			baggageTagCtx.fillStyle = "black";
			baggageTagCtx.fillText(that.destinationInfo1, xoffset + 170, 440); //43.6766°N, 79.6305°W
			baggageTagCtx.fillText(that.destinationInfo2, xoffset + 170, 460); // 569FT  UTC -4:00HR

			baggageTagCtx.font  = "18px monospace";
			baggageTagCtx.fillStyle = "black";
			baggageTagCtx.textAlign = "center";
			baggageTagCtx.fillText(that.barcodeString, canvasBackgroundImage.width/2 +xoffset , 584);

			var barcodeData = barcode._encodings[0][0].data;
			barcodeData = barcodeData + "0";

			var barcodeLRMargin = 100;
			var barcodeLen = barcodeData.length;
			var barWidthFactor = (600 - (2*xoffset) - (barcodeLRMargin*2))/ barcodeLen;
			var startBarcodeX =  (600 - xoffset - (barcodeLen * barWidthFactor)) - barcodeLRMargin; // (600 - (barcodeLRMargin*2)); // * barcodeLen / 2;


			var barWidth = 0;
			for (var i = 0; i < barcodeLen ; i++) {
				if(barcodeData.charAt(i-1) === '' || (barcodeData.charAt(i-1) === barcodeData.charAt(i))) {
					++barWidth;
					
				} else {

					if(barcodeData.charAt(i) === '0') {
						baggageTagCtx.beginPath();
						baggageTagCtx.fillStyle = "black";
						baggageTagCtx.fillRect(  parseInt(startBarcodeX + (i * barWidthFactor) - (barWidth * barWidthFactor)), 474 , barWidth * barWidthFactor, 90);
					}
					barWidth = 1;
				}
			} // End For

		 	that.baggageTagCanvas.toBlob(function(blob) {
				var url = URL.createObjectURL(blob);
				if(that.callback) that.callback(url);
			});


		}
		canvasBackgroundImage.src = that.backgroudImage;

	}


	destroy() {
		URL.revokeObjectURL(this.url);
		$(`#${that.name}-baggageTag-canvas-barcode`).remove();
		$(`#${that.name}-baggageTag-canvas`).remove();
	}
}
//export { LuggageTagRenderer };


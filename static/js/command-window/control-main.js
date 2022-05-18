import { Logger } from '/js/static/command-window/Logger.js';
import { SerialIO } from '/js/static/command-window/SerialIO.js';
import { URCHandler } from '/js/static/command-window/URCHandler.js';
import { Indicator } from '/js/static/command-window/Indicator.js';
// import { ATProcedures } from '/js/static/command-window/ATProcedures.js';
import { ConnectionManager } from '/js/static/command-window/ConnectionManager.js';

import { Configurator } from '/js/static/command-window/Configurator.js';


var serialPresent = false;
var modemTimeout;

jQuery.event.special.touchstart = {
        setup: function( _, ns, handle ){
            this.addEventListener("touchstart", handle, { passive: true });
        }
	};

$(document).ready(function() {
	var logger = new Logger();
	logger.system("Starting command window");
	logger.setMaxLog(200);

	var configurator = new Configurator(logger);

// setup the indicator on the screen
	var indicator = new Indicator([
			{'name': 'uart'		, 'status': Indicator.neutral, 'caption': 'UART' },
			{'name': 'modem'	, 'status': Indicator.neutral, 'caption': 'Modem' },
			{'name': 'attached'	, 'status': Indicator.neutral, 'caption': 'Attached' },
			{'name': 'gnss'		, 'status': Indicator.neutral, 'caption': 'GNSS' },
			{'name': 'tcp'		, 'status': Indicator.neutral, 'caption': 'TCP' }
		],
		"indicator"
	);


// checking serial API
	if (! "serial" in navigator) {
  		logger.warn("Serial API missing");
  		$('#modal-serialapi').modal('show');
	} else {
  		serialPresent = true;
		logger.system("Serial API detected");
	}
	if (! window.Worker) {
		logger.warn("Web Worker missing - please use a browser with this feature");
	}


	function modemAliveCB() {
		clearTimeout(modemTimeout);

		modemTimeout = setTimeout(function() {
			indicator.setState("modem",Indicator.tentative);
		} , 5000);
		indicator.setState("modem",Indicator.ok);
	}

// serial handler setup
	var serialIO = new SerialIO({
		baudRate: 115200,
		connectCallback: function() {
			indicator.setState("uart",Indicator.ok);
		},
		disconnectCallback: function() {
			indicator.setState("uart",Indicator.error);
			indicator.setState("modem",Indicator.tentative); 
			indicator.setState("attached",Indicator.tentative); 
			indicator.setState("gnss",Indicator.tentative); 
			indicator.setState("tcp",Indicator.tentative); 
			serialIO.close();
		},
		lineDelimiter: "\r\n",
	}, logger, modemAliveCB);


//	var atProcedures = new ATProcedures(serialIO, logger, configurator);



	var urcHandler = new URCHandler(logger);
	serialIO.registerCallback('urc-handler','^\\\+.*',urcHandler.handleURC,urcHandler);
	urcHandler.registerURCHandler("cXreg-handler", '^\\\+CE?REG', function(data) {
		const REG_PATTERN = /^\+C.?REG: *([0-5],)?([0-9]),?.*/g;
		var param = REG_PATTERN.exec(data);
		switch (param[2]) {
		  case '1': case '5': 						indicator.setState("attached",Indicator.ok); 
		  											indicator.setState("gnss",Indicator.tentative);
		  											indicator.setState("tcp",Indicator.tentative); 
		  											break;
		  case '0': case '2': case '3': case '4': 	indicator.setState("attached",Indicator.tentative); break;
		  default: 									indicator.setState("attached",Indicator.neutral);
		}
	}, null);
	urcHandler.registerURCHandler("GNSSEV-handler", '^\\\+GNSSEV: *[0-3]', function(data) {
		const REG_PATTERN = /^\+GNSSEV: *([0-3]),([0-4])/g;
		var param = REG_PATTERN.exec(data);
//		console.log(param);
		if(param[1] === '3') {
			if(parseInt(param[2]) > 0 && parseInt(param[2]) < 4) {
				indicator.setState("gnss",Indicator.ok); 
			} else {
				setTimeout(() => {indicator.setState("gnss",Indicator.tentative);} ,5000); 
				return;
			}
		} else if(param[1] === '2') {
			if(parseInt(param[2]) === '1') {
				setTimeout(() => {indicator.setState("gnss",Indicator.tentative);} ,5000); 
				return;
			}
		} else  {
			indicator.setState("gnss",Indicator.tentative);
		}
	}, null);
	urcHandler.registerURCHandler("TCP-handler", '^\\\+KCNX_IND: *[1-6],[0-9],[0-9]', function(data) {
		indicator.setState("tcp",Indicator.tentative);

	}, null);
	urcHandler.registerURCHandler("TCP-Con", '^\\\+KTCP_IND: *[0-9],1', function(data) {
		indicator.setState("tcp",Indicator.ok);
	}, null);
	urcHandler.registerURCHandler("TCP-Discon", '^\\\+KTCP_NOTIF: *[1-6],[0-1]?[0-9]', function(data) {
			indicator.setState("tcp",Indicator.tentative);
	}, null);

	var connectionManager = new ConnectionManager(serialIO, logger, configurator, urcHandler);
	window.connectionManager;

// command input command suggestion list loader and OnEnterKey handler
	$.getJSON( "/js/static/command-window/at-commands.json", function( data ) {
		$('.ui.search').search({
	    	source: data.items
	  	});
	});

	$( "#input-at" ).keypress(function(e) {
		if ( event.which == 13 ) {
     		event.preventDefault();
     		// logger.io(">>>" + $( "#input-at" ).val());
     		serialIO.sendln($( "#input-at" ).val());

  		}
	});

// serial Port setup by SerialWebAPI
	$( "#btn-serialport" ).click(function() {
  		serialIO.allocatePortDialog().then(
  			function() { 
		  		serialIO.open().then(
		  			function() { 
		  				indicator.setState("uart",Indicator.ok); 
	  					indicator.setState("modem",Indicator.tentative);
		  				serialIO.run();
		  				connectionManager.init();

		  			},
		  			function() { 
		  				indicator.setState("uart",Indicator.error); 
		  				indicator.setState("modem",Indicator.tentative); 
		  				indicator.setState("attached",Indicator.tentative); 
		  				indicator.setState("gnss",Indicator.tentative); 
		  				indicator.setState("tcp",Indicator.tentative); 
		  			}
		  		);
  			},
  			function() { 
  				indicator.setState("uart",Indicator.error); 
  				indicator.setState("modem",Indicator.tentative); 
 				indicator.setState("attached",Indicator.tentative); 
  				indicator.setState("gnss",Indicator.tentative); 
  				indicator.setState("tcp",Indicator.tentative); 
  			}
  		);

  	
	});
	$( "#btn-config" ).click(function() {
//		$('#configuration-modal').modal('show');

		configurator.open();
	});

// button at the end of the AT comamnd input to send data without line break	
	$( "#btn-send-witout-linebreak" ).click(function() {
  		serialIO.send($( "#input-at" ).val());
	});

// prevent just closing the window
	window.onbeforeunload = function() {
		serialIO.close();
		return "This will interrupt the script and will may bring the modem in an unknown state, UART ports will be closed";
	}



});
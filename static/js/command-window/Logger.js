
class Logger {


	constructor() {
		this.scrollLogEnable = true;
		this.maxLog = 20;
		this.actualLog = 0;
	}


	getTimeStamp() {
		var now = moment();
		var formatted = now.format('YYYY-MM-DD HH:mm:ss.SSS')
		return formatted;
	}
/*
	io(message) {
		this.log( {time:  this.getTimeStamp(), type: 'io', msg : message});
		
	}
*/

	rx(message,lb) {
		this.log( {time:  this.getTimeStamp(), type: 'rx', msg : message},lb);
		
	}
	tx(message,lb) {
		this.log( {time:  this.getTimeStamp(), type: 'tx', msg : message},lb);
		
	}

	system(message,lb) {
		this.log( {time:  this.getTimeStamp(), type: 'system', msg : message},lb);
		
	}
	norm(message,lb) {
		this.log( {time:  this.getTimeStamp(), type: 'norm', msg : message},lb);
		
	}
	info(message,lb) {
		this.log( {time:  this.getTimeStamp(), type: 'info', msg : message},lb);
		
	}
	warn(message,lb) {
		this.log( {time:  this.getTimeStamp(), type: 'warn', msg : message},lb);
		
	}
	
	log(data,lb) {
		
		if(lb) data.msg = data.msg.replace(/(\n|\r)/g, "<br />");

		var msgString = "";
		
		switch (data.type) {
		  case "system":
			  msgString = '<span class="logLineSpan logLineSpanSystem">[' + data.time +  '] : ' + data.msg +'</span>';
		    break;
		  case "rx":
			  msgString = '<span class="logLineSpan logLineSpanRX">[' + data.time +  '] : ' + data.msg +'</span>';
		    break;
		  case "tx":
			  msgString = '<span class="logLineSpan logLineSpanTX">[' + data.time +  '] : ' + data.msg +'</span>';
		    break;
		  case "info":
			  msgString = '<span class="logLineSpan logLineSpanInfo">[' + data.time +  '] : ' + data.msg +'</span>';
		    break;
		  case "norm":
			  msgString = '<span class="logLineSpan logLineSpanNorm">[' + data.time +  '] : ' + data.msg +'</span>';
		    break;  
		  case "warn":
			  msgString = '<span class="logLineSpan logLineSpanWarn">[' + data.time +  '] : ' + data.msg +'</span>';
		    break;  
		  default:
			  msgString = '<span class="logLineSpan logLineSpanWarn">[' + data.time +  '] : ' + JSON.stringify(data) +'</span>';
		}
		++this.actualLog;
		if(this.actualLog > this.maxLog) {
			$("#logtext").find('span:first').remove();
		}
		
		$("#logtext").append(msgString);
		
		
		
		if(this.scrollLogEnable) {
			$("#logtext").animate({
				scrollTop:$("#logtext")[0].scrollHeight - $("#logtext").height()
			},10,function(){this.scrollLogEnable=true;})
		}
	}


	setMaxLog(n) {
		this.maxLog = n;	
		this.info("Set log len to : " + this.maxLog);
	}
	
	enableLog() {
		this.scrollLogEnable = true;
	}

	disableLog() {
		this.scrollLogEnable = false;
	}

}
export { Logger };

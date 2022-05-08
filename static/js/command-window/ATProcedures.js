
class ATProcedures {


	constructor(serialIO, logger) {
		this.logger = logger;
		this.serialIO = serialIO;
	}

	async init() {
	//	var res =  await this.serialIO.sendAndExpect('AT\r','.*',2000); // Just clear any crap from UART
	//	res =  await this.serialIO.sendAndExpect('AT\r','.*',2000);
	//	res =  await this.serialIO.sendAndExpect('ATE0\r','.*OK.*',2000); // disable echo
	//	res = await this.serialIO.sendAndExpect( 'ATI\r','.*HL7802.*',2000); // see we're working wiht the right module
	//	res = await this.serialIO.sendAndExpect( 'AT+CMEE=1\r','.*OK.*',2000); // error reporting on
	//	res = await this.serialIO.sendAndExpect( 'AT+CREG?\r','^.CREG: (0|1),(5|1).*',2000); // are we registered ?
	//	res = await this.serialIO.sendAndExpect( 'AT+CGREG?\r','^.CGREG: (0|1),(5|1).*',2000);
	//	res = await this.serialIO.sendAndExpect( 'AT+KPATTERN="--EOF--Pattern--"\r','.*OK.*',2000); // set EOF pattern for internal stack
	//	res = await this.serialIO.sendAndExpect( 'AT+CGDCONT=1,"IP","' + nconf.get('APN') + '"\r','.*OK.*',2000); // set APN (may needs username and PW)
	//	res =  await this.serialIO.sendAndExpect('ATE0\r','.*OK.*',2000); // disable echo
	}

}
export { ATProcedures };

const jose = require('jose')
const fs               = require('fs');
const jwt              = require('jsonwebtoken');

const keydata = fs.readFileSync("google-keys/rsa_private.pem").toString();


console.log(keydata.toString());

async function joseJWT(token) {
	const algorithm = 'RS256'

	const ecPrivateKey = await jose.importPKCS8(keydata, algorithm)
	console.log(await new jose.SignJWT(token).setProtectedHeader({ alg: algorithm , typ: 'JWT' }).sign(ecPrivateKey));
	console.log("-------");

}


async function createJwt(token) {

		// const privateKey = fs.readFileSync(this.config.privateKeyFile);
		console.log(jwt.sign(token, keydata, {algorithm: 'RS256'}));
		console.log("-------");
};

/*
const token = {
    iat: parseInt(Date.now() / 1000),
    exp: parseInt(Date.now() / 1000) + 20 * 60, // 20 minutes
    aud: "superProject-1234",
};
*/
const token = { iat: 1652199163, exp: 1652200363, aud: 'superProject-1234' };
console.log(token);
joseJWT(token);

createJwt(token);

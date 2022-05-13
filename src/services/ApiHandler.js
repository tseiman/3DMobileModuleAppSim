/*
 * this handles the Demo page  API 
*/

"use strict";



const config = require('config');


const apiConf = config.get('apiconf');

module.exports = {
  setup: function () {
    if(!apiConf.enable) {
      console.log(`API disabled`);
      return;
    }

    var app = express();


    app.get("/", (req, res, next) => {
      res.send('Hello from App Engine!');
    });

    return app;
  

  }
}


/*
 * this handles the Demo page with the 3D animation and the Modem control
*/

"use strict";
const bodyParser                = require('body-parser');
const express                   = require('express');
const fs                        = require("fs");
const path                      = require('path');



const config = require('config');


const frontendConf = config.get('frontend');

module.exports = {
  setup: function () {
    var app = express();

    app.set('view engine', 'ejs');
//router.set('view engine', 'ejs');

  const resourceFolders = [
    { 'name': 'pictures'        , 'url': '/pic/static/'           , 'folder' : '../../static/pic'},
    { 'name': 'javascript'      , 'url': '/js/static/'            , 'folder' : '../../static/js'},
    { 'name': 'css'             , 'url': '/css/static/'           , 'folder' : '../../static/css'},
    { 'name': 'jquery'          , 'url': '/js/jquery/'            , 'folder' : '../../node_modules/jquery/dist'},
    { 'name': 'font-awesome'    , 'url': '/fnt/font-awesome/'     , 'folder' : '../../node_modules/font-awesome/'},
    { 'name': 'moment'          , 'url': '/js/moment/'            , 'folder' : '../../node_modules/moment/min'},
    { 'name': 'bootstrap'       , 'url': '/bootstrap/'            , 'folder' : '../../node_modules/bootstrap/dist'}
  ]; 

  resourceFolders.forEach(function (item, index) {
    console.debug('SierraFlightHandler "' + item.name + '" with URL="' + item.url + '" Path="' + path.join(__dirname, item.folder ) + '"');
    app.use(item.url, express.static(path.join(__dirname, item.folder)));
  });

  app.get("/*", (req, res, next) => {
      res.filename = req.params[0].replace("/","");
      if(res.filename === "") res.filename = "flightbooking";

      console.info(`Client access for Flightbooking  "${res.filename}" page from "${req.connection.remoteAddress}"`);


      let fileExists = new Promise((resolve, reject) => {
          // check if file exists
          fs.stat("views/sierraflight/" + res.filename + ".ejs", (err, stats) => {
              if (err) {
                  return reject(err);
              }
              return resolve(stats);
          });
      });

      fileExists.then((stats) => {
          res.stats = stats;
          res.render('sierraflight/' + res.filename);

      }).catch((err) => {
          console.error(err);
          res.stats = { error: err };
          next();
      });

  });

  return app;
  

  }
}


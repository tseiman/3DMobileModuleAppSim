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
    { 'name': 'blender'         , 'url': '/blender/static/'       , 'folder' : '../../static/blender'}, 
    { 'name': 'tree'            , 'url': '/js/three/build/'       , 'folder' : '../../node_modules/three/build'},
    { 'name': 'tree jsm'        , 'url': '/js/three/jsm/'         , 'folder' : '../../node_modules/three/examples/jsm'},
    { 'name': 'jquery'          , 'url': '/js/jquery/'            , 'folder' : '../../node_modules/jquery/dist'},
    { 'name': 'jsbarcode'       , 'url': '/js/jsbarcode/'         , 'folder' : '../../node_modules/jsbarcode/dist'},
    { 'name': 'semantic'        , 'url': '/semantic/static/'      , 'folder' : '../../static/semantic/dist'}, 
    { 'name': 'semantic-dist'   , 'url': '/dist/'                 , 'folder' : '../../static/semantic/dist'},
    { 'name': 'moment'          , 'url': '/js/moment/'            , 'folder' : '../../node_modules/moment/min'},
    { 'name': 'lato'            , 'url': '/fnt/lato-font/'        , 'folder' : '../../node_modules/lato-font/'},
    { 'name': 'font-awesome'    , 'url': '/fnt/font-awesome/'     , 'folder' : '../../node_modules/font-awesome/'},
    { 'name': 'jose'            , 'url': '/js/jose/'              , 'folder' : '../../node_modules/jose/dist/browser'},
    { 'name': 'buffer'          , 'url': '/js/buffer/'            , 'folder' : '../../node_modules/buffer'}
  ]; 

  resourceFolders.forEach(function (item, index) {
    console.debug('Current "' + item.name + '" with URL="' + item.url + '" Path="' + path.join(__dirname, item.folder ) + '"');
    app.use(item.url, express.static(path.join(__dirname, item.folder)));
  });

  app.get("/", (req, res, next) => {
    res.send('Hello from App Engine!');
  });

  app.get("/app/*", (req, res, next) => {
      res.filename = req.params[0].replace("app/","");
      console.info(`Client access for "${res.filename}" page from "${req.connection.remoteAddress}"`);


      let fileExists = new Promise((resolve, reject) => {
          // check if file exists
          fs.stat("views/demo/" + res.filename + ".ejs", (err, stats) => {
              if (err) {
                  return reject(err);
              }
              return resolve(stats);
          });
      });

      fileExists.then((stats) => {
          res.stats = stats;
          res.render('demo/' + res.filename);

      }).catch((err) => {
          console.error(err);
          res.stats = { error: err };
          next();
      });

  });

  return app;
  

  }
}


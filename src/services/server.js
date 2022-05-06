// "use strict";
const bodyParser 								= require('body-parser');
const express 									= require('express');
const fs 												= require("fs");
const path 											= require('path');

const viewerApp = express();

const config = require('config');

const frontendConf = config.get('frontend');


module.exports = {
  setup: function () {


		viewerApp.set('view engine', 'ejs');

		const resourceFolders = [
			{ 'name': 'pictures'				, 'url': '/pic/static/'						, 'folder' : '../../static/pic'},
			{ 'name': 'javascript'			, 'url': '/js/static/'						, 'folder' : '../../static/js'},
			{ 'name': 'css'							, 'url': '/css/static/'						, 'folder' : '../../static/css'},
			{ 'name': 'blender'					, 'url': '/blender/static/'				, 'folder' : '../../static/blender'}, 
			{ 'name': 'tree'						, 'url': '/js/three/build/'				, 'folder' : '../../node_modules/three/build'},
			{ 'name': 'tree jsm'				, 'url': '/js/three/jsm/'					, 'folder' : '../../node_modules/three/examples/jsm'},
			{ 'name': 'jquery'					, 'url': '/js/jquery/'						, 'folder' : '../../node_modules/jquery/dist'},
			{ 'name': 'jsbarcode'				, 'url': '/js/jsbarcode/'					, 'folder' : '../../node_modules/jsbarcode/dist'},
			{ 'name': 'semantic'				, 'url': '/semantic/static/'			, 'folder' : '../../static/semantic/dist'}, 
			{ 'name': 'semantic-dist'		, 'url': '/dist/'									, 'folder' : '../../static/semantic/dist'},
			{ 'name': 'moment'					, 'url': '/js/moment/'						, 'folder' : '../../node_modules/moment/min'},
			{ 'name': 'lato'						, 'url': '/fnt/lato-font/'				, 'folder' : '../../node_modules/lato-font/'},
			{ 'name': 'font-awesome'		, 'url': '/fnt/font-awesome/'			, 'folder' : '../../node_modules/font-awesome/'}
		]; 

		resourceFolders.forEach(function (item, index) {
			console.debug('Current "' + item.name + '" with URL="' + item.url + '" Path="' + path.join(__dirname, item.folder ) + '"');
			viewerApp.use(item.url, express.static(path.join(__dirname, item.folder)));
		});

		viewerApp.get("/", (req, res, next) => {
			res.send('Hello from App Engine!');
		});

		viewerApp.get("/app/*", (req, res, next) => {
		    res.filename = req.params[0].replace("app/","");
     	  console.info(`Client access for "${res.filename}" page from "${req.connection.remoteAddress}"`);


		    let fileExists = new Promise((resolve, reject) => {
		        // check if file exists
		        fs.stat("views/" + res.filename + ".ejs", (err, stats) => {
		            if (err) {
		                return reject(err);
		            }
		            return resolve(stats);
		        });
		    });

		    fileExists.then((stats) => {
		        res.stats = stats;
					  res.render(res.filename);

		    }).catch((err) => {
		    		console.error(err);
		        res.stats = { error: err };
		        next();
		    });

		});

		const PORT = parseInt(process.env.PORT) || frontendConf.webuiport;

		viewerApp.listen(PORT, ()=>console.info(`viewer listening to port ${PORT}`));

  }
};
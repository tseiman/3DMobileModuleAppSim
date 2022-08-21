// import * as THREE from 'http://localhost:3001/js/three.module.js';
 
/*
import { GLTFLoader } from '/../js/jsm/loaders/GLTFLoader.js'; 
*/
// import * as GLTFLoader from 'http://localhost:3001/js/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three'
import { GLTFLoader } from '/js/three/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '/js/three/jsm/controls/OrbitControls.js';
import { TWEEN } from '/js/three/jsm/libs/tween.module.min.js';

import { SceneLoader } 		from '/js/static/shared/SceneLoader.js';
import { AnimationManager } from '/js/static/shared/AnimationManager.js';
import { Progressbar } from '/js/static/shared/Progressbar.js';
import { LuggageTagRenderer } from '/js/static/suitcase/LuggageTagRenderer.js';
import { BroadcastCom } from '/js/static/shared/BroadcastCom.js';



var camera;
var controls;

var raycaster, mouse;	
var info = true;
var autoAnimLock = false;

var broadcastChannel = new BroadcastCom("sierrademo.suitcase", console);


window.getCameraState = function() {
	return {"pos" : camera.position, "rotation": camera.rotation, "target": controls.target};
}

function setCam(camera,controls,state) {
	console.log(state);
	camera.position.set(state.pos.x,state.pos.y,state.pos.z);
	camera.rotation.set(state.rotation.x,state.rotation.y,state.rotation.z);
	controls.target.set(state.target.x,state.target.y,state.target.z);
	controls.update();
}

async function callAnimation(animationManager) {

	if(autoAnimLock) return;
	autoAnimLock = true;
	var loadNextAnim = true;



	while(loadNextAnim) {
		
		var nextAnim = animationManager.getNextAnimation();

		if(typeof nextAnim.continue !== 'undefined') {
			loadNextAnim = nextAnim.continue;					
		} else {
			loadNextAnim = true; 
		}

		if(!nextAnim) {
			animationManager.resetAnimation();
			break;
		}
		if(nextAnim.type === 'camera') {
			await animationManager.animateCamera(nextAnim);
		} else if (nextAnim.type === 'mesh') {
			await animationManager.animateItem(nextAnim);
		} else if (nextAnim.type === 'texture') {
			await animationManager.animateTexture(nextAnim.item,nextAnim.materialName,nextAnim.newTexture);
		} else if (nextAnim.type === 'urlcall') {

			try {
				const response = await fetch(
					nextAnim.url,
					{
						method: 'GET',
						mode: 'no-cors'
					}
				);

				console.log(response);
			} catch (e) {
				console.warn(e);
			}
		} else if (nextAnim.type === 'sleep') {	
			await new Promise(r => setTimeout(r, nextAnim.duration));
		} else if (nextAnim.type === 'command') {
			var msg = {'type': 'ctrlcmd', 'cmd': nextAnim.cmd};
			if(nextAnim.message) msg.message = nextAnim.message;
			broadcastChannel.sendData("sierrademo.command", msg);
		} else {
			console.error(`unknown item type to animate: "${nextAnim.type}" for item "${nextAnim.item}"`);
		}
	}
	autoAnimLock = false;
}

 $( document ).ready(function() {


	broadcastChannel.registerListener(
		"listener.sierrademo.suitcase",
		function(msg, self) {
			console.log("Got a BC message: ", msg);
			if((!msg.data.type) || (msg.data.type !== 'tagupdate')) return;

			new LuggageTagRenderer({
					'name'				: "luggageTag",
					'barcodeString'		: msg.data.timest,
					'flightWeight'		: (Math.random() * (20 - 5) + 5).toFixed(1),
					'flightNo'			: msg.data.flightno,
					'passengerName'		: msg.data.firstName + " " + msg.data.secondName,
					'destinationShort'	: msg.data.destShort,
					'destinationLong'	: msg.data.destination,
					'destinationInfo1'	: msg.data.info1,
					'destinationInfo2'	: msg.data.info2,
					'backgroudImage'	: "/pic/static/suitcase/LuggageTag.svg",
					'callback'			: function(url) {
						animationManager.animateTexture("suitcase","TagField", url, function(url) {
							URL.revokeObjectURL(url);
						});	
					}
				});


		}
	);


	var scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight , 0.001, 1000 );

	var mainCanvas = document.getElementById("mainCanvas")
	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, autoSize: true ,canvas: mainCanvas });
	renderer.setSize( window.innerWidth, window.innerHeight );
//	renderer.setClearColor(0x808080);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = true;
	document.body.appendChild( renderer.domElement );

  	raycaster = new THREE.Raycaster();
  	mouse = new THREE.Vector2();

  	renderer.domElement.addEventListener('click', mousedown, false);

// const axesHelper = new THREE.AxesHelper( 5 );
// scene.add( axesHelper );
  	function mousedown(event) {

		event.preventDefault();


		raycaster.setFromCamera(mouse, camera);
		var intersects = raycaster.intersectObjects(scene.children, true);

		if (intersects.length > 0) {
			if(intersects[0].object.userData.clickable && intersects[0].object.name === 'LuggageTagPlane') {

				console.log('Found clickable:', intersects[0].object.name);
				// animationManager.animateTexture("suitcase","TagField","/pic/static/suitcase/FlightTag_YYZ.png"	);
				if(controls.enabled)return;

				new LuggageTagRenderer({
					'name'				: "luggageTag",
					'barcodeString'		: new Date().valueOf(),
					'flightWeight'		: 15,
					'flightNo'			: "XY 1234",
					'passengerName'		: "Jean Doe",
					'destinationShort'	: "YYZ",
					'destinationLong'	: "Toronto",
					'destinationInfo1'	: "43.6766°N, 79.6305°W",
					'destinationInfo2'	: "569FT  UTC -4:00HR",
					'backgroudImage'	: "/pic/static/suitcase/LuggageTag.svg",
					'callback'			: function(url) {
						animationManager.animateTexture("suitcase","TagField", url, function(url) {
							URL.revokeObjectURL(url);
						});	
					}
				});


			}
		}

	//  this is to give a position on the earth sphere to build the animation
		var mouseSphereClick = {
		  x: ((event.clientX - 1) / window.innerWidth ) * 2 - 1,
		  y: -((event.clientY - 1) / window.innerHeight) * 2 + 1
		};
		var vector = new THREE.Vector3();
		vector.set(mouseSphereClick.x, mouseSphereClick.y, 0.5);
		vector.unproject(camera);
		raycaster.ray.set(camera.position, vector.sub(camera.position).normalize());
		let target = raycaster.intersectObjects([animationManager.getItem("earth")]);
		if(target[0]) {
			console.log(target[0].point);
		}

	}

 // 	renderer.domElement.addEventListener('mouseup', mouseup, false);

  //	function mouseup() {
//		controls.enabled = true;
//	}



//	renderer.outputEncoding = THREE.sRGBEncoding;
	document.body.appendChild( renderer.domElement );

	controls = new OrbitControls( camera , renderer.domElement);
//	controls.minDistance = 4.8;
window.controls = controls;
//	controls.maxZoom = 1;
	

	controls.update();

	var animationManager = new AnimationManager(camera, controls);
	animationManager.pushNewItem("camera",camera);
 window.animationManager = animationManager;
	//controls.addEventListener( 'change', function(){ onCameraChange(camera); } ); // use if there is no animation loop

	function itemLoadedCallback(item) {
		animationManager.pushNewItem(item.name,item.item);

	}
	var sceneLoader = new SceneLoader(scene,itemLoadedCallback);




   	 $(document).on('keydown', function(e){ //console.log(e.shiftKey)} );

   	
   	 	if(info) return;
   	 	if(e.which == 78) { // 'n' = next pressed

    	} else if(e.which == 32) {
   	 		callAnimation(animationManager);

    		// var luggageTagGroup = animationManager.getItem("suitcase").children.filter(obj => { return obj.name === 'LuggageTag'});
    		// luggageTagGroup.on( 'click',function(ev){console.log("juhuuuuuu", ev); }  );
    		// console.log(luggageTagGroup);


    	} else if( e.shiftKey) { 
    		controls.enabled = false;

    	}

   	 }); // on keydown
   	 $(document).on('keyup', function(e){ //console.log(e.shiftKey)} );
		if(! e.shiftKey) { 
    		controls.enabled = true;
    	}

    	if(e.which === 32) { 
    		e.preventDefault();
    	}
   	 }); // on keyup
	 camera.position.z = 10;



// animation function

	function animate() {
		requestAnimationFrame( animate );
		TWEEN.update();
		renderer.render( scene, camera );
	};

	animate(); 


// the info overlay which can be omitted by url param ?noinfo=true

	var url = new URL(window.location.href);
	var noinfo = (url.searchParams.get("noinfo") === 'true');
	if(info && (!noinfo)) {
		$("#info-overlay").show();
		$( "#info-overlay" ).click(function() {
			info = false;
  			$("#info-overlay").hide();
		});
	}
	if(noinfo) info = false;


	const container = document.getElementById("jsoneditor");
    const options = {search: true, mode: 'code', modes: ['code', 'form'] };
    const editor = new JSONEditor(container, options);


	var localScript = window.localStorage.getItem("suitcase-script");

	var progressbar = new Progressbar('#progressbar');

	if (localScript && (localScript !== null) && (localScript !== "") && (localScript !== "{}") ) {


		console.log("loading from local script !");
		var animationData = JSON.parse(localScript);
		animationManager.animation = animationData.animation;
	    editor.set(animationData)

		sceneLoader.iterateLoadable(animationData.load, progressbar);

	} else {
		console.log("loading remote script !");

		$.getJSON( "/js/static/suitcase/baggagetag_animation.json", async function( data ) {
			sceneLoader.iterateLoadable(data.load, progressbar);
			animationManager.animation = data.animation;
		    editor.set(data)			
		});

	 }



// open the modem - app window
	$( "#btn-ctrl-window" ).click(function() {
		window.open('/app/suitcase-demo-control','control-window','directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,fullscreen=yes');
	});

	$( "#btn-code-window" ).click(function() {
		$('#script-code-modal').modal('show');
	});


	$( "#btn-script-ok" ).click(function() {

		scene = new THREE.Scene();
		sceneLoader = new SceneLoader(scene,itemLoadedCallback);

		var progressbar = new Progressbar('#progressbar');
		var animationData = editor.get();

		window.localStorage.setItem("suitcase-script", JSON.stringify(animationData));

		animationManager.animation = animationData.animation;

		window.progressbar = progressbar;

		var loadStepsPercent = 100 / animationData.load.length;
		var loadedPercent = 0;
	    animationData.load.forEach(function(item) {
			var newItem = sceneLoader.load(item);
			loadedPercent += loadStepsPercent;
			progressbar.set(loadedPercent);
		});
		setTimeout(function() {progressbar.destroy();},500);


	});

});

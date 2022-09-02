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
// import { LuggageTagRenderer } from '/js/static/suitcase/LuggageTagRenderer.js';
import { BroadcastCom } from '/js/static/shared/BroadcastCom.js';
import { CSS2DRenderer, CSS2DObject } from '/js/three/jsm/renderers/CSS2DRenderer.js';
import { EMeterController } from '/js/static/electricitymeter/EMeterController.js';


var camera;
var controls;

var raycaster, mouse;	
var info = true;
var autoAnimLock = false;

var broadcastChannel = new BroadcastCom("sierrademo.electricitymeter", console);

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

	console.log("THREE version: r"+	 THREE.REVISION);


	broadcastChannel.registerListener(
		"listener.sierrademo.electricitymeter",
		function(msg, self) {
			console.log("Got a BC message: ", msg);
			if((!msg.data.type) || (msg.data.type !== 'tagupdate')) return;

		}
	);


	var scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight , 0.1, 100 );


	var mainCanvas = document.getElementById("mainCanvas")
	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, autoSize: true ,canvas: mainCanvas });
//	const renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = true;
	renderer.receiveShadow = true;
	renderer.shadowMap.type = THREE.VSMShadowMap;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.gammaOutput = true;
    renderer.physicallyCorrectLights = true;

	document.body.appendChild( renderer.domElement );
  //	raycaster = new THREE.Raycaster();
  //	mouse = new THREE.Vector2();




	let labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
	labelRenderer.domElement.style.position = 'absolute';
	labelRenderer.domElement.style.top = '0px';
	// labelRenderer.domElement.style.pointerEvents = 'none';
	document.body.appendChild( labelRenderer.domElement );

	controls = new OrbitControls( camera , renderer.domElement);
	
	 camera.position.z = 4;
	 camera.position.y = 10;

	controls.update();

	var animationManager = new AnimationManager(camera, controls);
	animationManager.pushNewItem("camera",camera);
	//controls.addEventListener( 'change', function(){ onCameraChange(camera); } ); // use if there is no animation loop


	var eMeterController = new EMeterController(scene);
	

	function itemLoadedCallback(item) {
		animationManager.pushNewItem(item.name,item.item);

	}
	var sceneLoader = new SceneLoader(scene, itemLoadedCallback, eMeterController);
window.sceneLoader = sceneLoader;
window.scene = scene;
window.camera = camera;
window.renderer = renderer;
window.THREE = THREE;
window.animationManager = animationManager;
window.eMeterController = eMeterController;





// animation function


	function animate() {
		requestAnimationFrame( animate );
		TWEEN.update();
		renderer.render( scene, camera );
		labelRenderer.render( scene, camera );

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


	var localScript = window.localStorage.getItem("electricitymeter-script");


	var progressbar = new Progressbar('#progressbar');

	if (localScript && (localScript !== null) && (localScript !== "") && (localScript !== "{}") ) {

		console.log("loading from local script !");
		var animationData = JSON.parse(localScript);
		animationManager.animation = animationData.animation;
	    editor.set(animationData)

		sceneLoader.iterateLoadable(animationData.load, progressbar);

			
	} else {
		console.log("loading remote script !");

		$.getJSON( "/js/static/electricitymeter/electricitymeter_animation.json", async function( data ) {
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

		window.localStorage.setItem("electricitymeter-script", JSON.stringify(animationData));

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



	$( "#btn-play" ).click(function() {

		if($( "#btn-play" ).attr("run") === 'false') {
			$( "#btn-play" ).attr("run",'true');
			$( "#btn-play i" ).removeClass("fa-circle-play").addClass("fa-circle-pause");
			eMeterController.startMeter();
		} else {
			eMeterController.stopMeter();
			$( "#btn-play" ).attr("run",'false');
			$( "#btn-play i" ).removeClass("fa-circle-pause").addClass("fa-circle-play");
		}



	});

});

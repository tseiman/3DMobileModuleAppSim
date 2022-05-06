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



var camera;
var controls;

var raycaster, mouse;	
var info = true;




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

 $( document ).ready(function() {



	const scene = new THREE.Scene();
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
				animationManager.animateTexture("suitcase","TagField","/pic/static/suitcase/FlightTag_YYZ.png"	);

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



	$.getJSON( "/js/static/suitcase/baggagetag_animation.json", async function( data ) {
		var progressbar = new Progressbar('#progressbar');
		window.progressbar = progressbar;
		var loadStepsPercent = 100 / data.load.length;
		var loadedPercent = 0;
		data.load.forEach(function(item) {
			var newItem = sceneLoader.load(item);
			loadedPercent += loadStepsPercent;
			progressbar.set(loadedPercent);
		});
		animationManager.animation = data.animation;
		setTimeout(function() {progressbar.destroy();},500);
	});

   	 $(document).on('keydown', function(e){ //console.log(e.shiftKey)} );

   	
   	 if(info) return;
   	 if(e.which == 78) { // 'n' = next pressed
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
		//			nextAnim = animationManager.getNextAnimation();
					break;
				}
				if(nextAnim.type === 'camera') {
					animationManager.animateCamera(nextAnim);
				} else if (nextAnim.type === 'mesh') {
					animationManager.animateItem(nextAnim);
				} else if (nextAnim.type === 'texture') {
					animationManager.animateTexture(nextAnim.item,nextAnim.materialName,nextAnim.newTexture);
				} else {
					console.error(`unknown item type to animate: "${nextAnim.type}" for item "${nextAnim.item}"`);
				}
			}

    	} else if(e.which == 32) {

    		// var luggageTagGroup = animationManager.getItem("suitcase").children.filter(obj => { return obj.name === 'LuggageTag'});
    		// luggageTagGroup.on( 'click',function(ev){console.log("juhuuuuuu", ev); }  );
    		// console.log(luggageTagGroup);


    	} else if( e.shiftKey) { 
    		controls.enabled = false;

    	}

   	 });
   	 $(document).on('keyup', function(e){ //console.log(e.shiftKey)} );
		if(! e.shiftKey) { 
    		controls.enabled = true;
    	}
   	 });
	 camera.position.z = 10;



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


// open the modem - app window
	$( "#btn-ctrl-window" ).click(function() {
		window.open('/app/suitcase-demo-control','control-window','directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,fullscreen=yes');
	});

});

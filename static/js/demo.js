// import * as THREE from 'http://localhost:3001/js/three.module.js';
 
/*
import { GLTFLoader } from '/../js/jsm/loaders/GLTFLoader.js'; 
*/
// import * as GLTFLoader from 'http://localhost:3001/js/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three'
import { GLTFLoader } from '/js/three/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '/js/three/jsm/controls/OrbitControls.js';
import { TWEEN } from '/js/three/jsm/libs/tween.module.min.js';


window.getCameraState = function(camera, controls) {
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

	console.log(`("serial" in navigator): ${"serial" in navigator}`);


	const scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight , 0.001, 1000 );

	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, autoSize: true  });
	renderer.setSize( window.innerWidth, window.innerHeight );
//	renderer.setClearColor(0x808080);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = true;


//	renderer.outputEncoding = THREE.sRGBEncoding;
	document.body.appendChild( renderer.domElement );

	var controls = new OrbitControls( camera , renderer.domElement);

	controls.update();

	//controls.addEventListener( 'change', function(){ onCameraChange(camera); } ); // use if there is no animation loop

	const light = new THREE.AmbientLight(0xFFFFFF, 1.0);
	scene.add( light );

	var posizioneLuce1 = [0, 0, 40];
	
	var light2 = new THREE.PointLight(0xFFFFFF, 0.5, 600);
	light2.castShadow = true;			
	light2.position.set (posizioneLuce1[0], posizioneLuce1[1], posizioneLuce1[2]);
	scene.add(light2);
	light2.shadow.mapSize.width = 512;
	light2.shadow.mapSize.height = 512;
	light2.shadow.camera.near = 0.5;
	light2.shadow.camera.far = 500;
	
	var posizioneLuce2 = [-50, 50, -40];
	
	var light3 = new THREE.PointLight(0xFFFFFF, 0.5, 600);
	light3.castShadow = true;			
	light3.position.set (posizioneLuce2[0], posizioneLuce2[1], posizioneLuce2[2]);
	scene.add(light3);
	light3.shadow.mapSize.width = 512;
	light3.shadow.mapSize.height = 512;
	light3.shadow.camera.near = 0.5;
	light3.shadow.camera.far = 500;


	const loader = new GLTFLoader(); 

	loader.load( '/blender/static/suitcase.gltf', 
		function ( gltf ) { 
			gltf.scene.position.set( -0.18, 0.35,3.66 );
			gltf.scene.rotation.set( 0.9, 1, 0 );

			scene.add( gltf.scene ); 
		}, 	
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},
		function ( error ) { 
			console.error( error ); 
		}
	);


	

	loader.load( '/blender/static/earth.gltf', 
		function ( gltf ) { 
			gltf.scene.position.set( 0, -2, 0 );
			gltf.scene.scale.set( 4, 4, 4 );
			gltf.scene.rotation.set( 0.5, -1.9, 0 );
			scene.add( gltf.scene ); 
		}, 	
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},
		function ( error ) { 
			console.error( error ); 
		}
	);

	$(window).keypress(function(e) {
       	if(e.which == 110) { // 'n' = next pressed
			// setCam(camera,controls,{"pos":{"x":-0.17103507754535174,"y":-0.3793038252939638,"z":4.476904015523391},"rotation":{"_x":0.5827314285723717,"_y":-0.011191753246801665,"_z":0.007375965589797122,"_order":"XYZ"},"target":{"x":-0.12880347511685897,"y":1.6971680076105373,"z":1.3263397242339794}});

									// {"pos":{"x":-0.17103507754535174,"y":-0.3793038252939638,"z":4.476904015523391},"rotation":{"_x":0.5827314285723717,"_y":-0.011191753246801665,"_z":0.007375965589797122,"_order":"XYZ"},"target":{"x":-0.12880347511685897,"y":1.6971680076105373,"z":1.3263397242339794}};
			var actualCamState =  getCameraState(camera,controls);
			var posCoords = { 'x': actualCamState.pos.x ,'y': actualCamState.pos.y, 'z': actualCamState.pos.z};
    		var newPosCoords = {'x':-0.17103507754535174,'y':-0.3793038252939638,'z':4.476904015523391}; 
  
    		new TWEEN.Tween(posCoords).to(newPosCoords).onUpdate(() => {
        		//	console.log(posCoords);
        		camera.position.set(posCoords.x, posCoords.y, posCoords.z)
    		}).start();

  			var rotCoords = { 'x': actualCamState.rotation.x ,'y': actualCamState.rotation.y, 'z': actualCamState.rotation.z};
    		var newRotCoords = {'x': 0.5827314285723717,'y': -0.011191753246801665,'z':0.007375965589797122}; 
  
    		new TWEEN.Tween(rotCoords).to(newRotCoords).onUpdate(() => {
        		//	console.log(posCoords);
        		camera.rotation.set(rotCoords.x, rotCoords.y, rotCoords.z)
    		}).easing(TWEEN.Easing.Quartic.InOut).start();


  			var targetCoords = { 'x': actualCamState.target.x ,'y': actualCamState.target.y, 'z': actualCamState.target.z};
    		var newTargetCoords = {'x': -0.12880347511685897,'y': 1.6971680076105373,'z':1.3263397242339794}; 
  
    		new TWEEN.Tween(targetCoords).to(newTargetCoords).onUpdate(() => {
        		//	console.log(posCoords);
        		controls.target.set(targetCoords.x, targetCoords.y, targetCoords.z)
    		}).easing(TWEEN.Easing.Quartic.InOut).start();


    	}
   	});

	 camera.position.z = 10;
//	camera.position.set( 1, 1, 2 );

	function animate() {
		requestAnimationFrame( animate );

		TWEEN.update();
//		cube.rotation.x += 0.01;
//		cube.rotation.y += 0.01;

		renderer.render( scene, camera );
	};

	animate(); 





});

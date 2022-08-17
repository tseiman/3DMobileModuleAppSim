import * as THREE from 'three'

export default class Test {
	constructor(scene) {
		this.scene = scene;
	}

	load() {
		var posizioneLuce = [ 0.15, 1.5, 2 ];	
/*
	const geometry = new THREE.BoxGeometry( 0.15, 0.15, 0.15 );
		const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		const cube = new THREE.Mesh( geometry, material );
		cube.position.set (posizioneLuce[0], posizioneLuce[1], posizioneLuce[2]);
		cube.castShadow = false;
		cube.receiveShadow = false;
		cube.name="Test";
		this.scene.add( cube );
*/

/* const targetObject = new THREE.Object3D();
targetObject.position.set(posizioneLuce[0], posizioneLuce[1] -10, posizioneLuce[2]);
this.scene.add( targetObject );
*/
const light = new THREE.PointLight( 0xffffff, 10, 100 );
light.position.set(posizioneLuce[0], posizioneLuce[1] , posizioneLuce[2]);
light.castShadow = true; // default false
scene.add( light );

//Set up shadow properties for the light
light.shadow.mapSize.width = 512; // default
light.shadow.mapSize.height = 512; // default
light.shadow.camera.near = 1.9; // default
light.shadow.camera.far = 2; // default


light.name="Test";

 const helper = new THREE.CameraHelper( light.shadow.camera );
this.scene.add( helper );

return light;

	}

}


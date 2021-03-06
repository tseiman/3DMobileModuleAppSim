import * as THREE from 'three'

export default class Light1 {
	constructor(scene) {
		this.scene = scene;
	}

	load() {
		var posizioneLuce = [-200, 200, 200];	
		var light = new THREE.PointLight(0xFFFFFF, 0.7, 600);
		light.castShadow = true;			
		light.position.set (posizioneLuce[0], posizioneLuce[1], posizioneLuce[2]);
		this.scene.add(light);
		light.shadow.mapSize.width = 512;
		light.shadow.mapSize.height = 512;
		light.shadow.camera.near = 0.5;
		light.shadow.camera.far = 500;

		return light;
	}

}


import * as THREE from 'three'

export default class Light1 {
	constructor(scene) {
		this.scene = scene;
	}

	load() {
		var posizioneLuce = [-200, 200, 200];	
		var light = new THREE.PointLight(0xFFFFFF, 1.2, 600);
		light.name="Light1";
		light.castShadow = false;			
		light.position.set (posizioneLuce[0], posizioneLuce[1], posizioneLuce[2]);
		this.scene.add(light);
/*		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;
		light.shadow.camera.near = 0.5;
		light.shadow.camera.far = 500;
*/	
		return light;
	}

}


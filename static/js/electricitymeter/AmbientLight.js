import * as THREE from 'three'

export default class AmbientLight {
	constructor(scene) {
		this.scene = scene;
	}

	load() {
		const light = new THREE.AmbientLight(0xFFE5C1, 0.5);
		light.name="AmbientLight";
		this.scene.add( light );
		return light;
	}

}


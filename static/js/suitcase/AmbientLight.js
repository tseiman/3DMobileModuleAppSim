import * as THREE from 'three'

export default class AmbientLight {
	constructor(scene) {
		this.scene = scene;
	}

	load() {
		const light = new THREE.AmbientLight(0xFFFFFF, 1.3);
		this.scene.add( light );
		return light;
	}

}


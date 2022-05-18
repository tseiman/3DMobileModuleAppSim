import * as THREE from 'three'

export default class Earth {
	constructor(scene) {
		this.scene = scene;
	}

	load() {
		var geometry = new THREE.SphereGeometry(4.08, 32, 32);
		var material = new THREE.MeshPhongMaterial();
		var earthmesh = new THREE.Mesh(geometry, material);
		material.map    = new THREE.TextureLoader().load('/pic/static/suitcase/8081_earthmap4k_2color.png');
		material.bumpMap   = new THREE.TextureLoader().load('/pic/static/suitcase/8081_earthspec4k.png');     
		material.bumpScale = -0.02; 
		material.specularMap = new THREE.TextureLoader().load('/pic/static/suitcase/8081_earthspec4k.png')
		material.specular  = new THREE.Color('grey')

		earthmesh.rotation.set(0.5,-1.9, 0);
		this.scene.add(earthmesh);
		return earthmesh;
	}

}

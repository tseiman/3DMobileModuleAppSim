import * as THREE from 'three'
import { Reflector } from '/js/three/jsm/objects/Reflector.js';

const MATERIAL_GLASS = new THREE.MeshPhysicalMaterial({
		metalness: .9,
		roughness: .05,
		envMapIntensity: 0.9,
		clearcoat: 1,
		transparent: true,
		// transmission: .95,
		opacity: .5,
		reflectivity: 0.2,
		refractionRatio: 0.985,
		ior: 0.9,
		side: THREE.BackSide,
	});


/*
const MATERIAL_MIRROR = new THREE.MeshPhysicalMaterial({
		metalness: .9,
		roughness: .05,
		envMapIntensity: 0.9,
		clearcoat: 1,
		transparent: false,
		// transmission: .95,
		opacity: 0,
		reflectivity: 0.2,
		refractionRatio: 0.985,
		ior: 0.9,
		side: THREE.BackSide,
	});
*/
const MATERIAL_TEST = new THREE.MeshStandardMaterial({ color: 'purple' });


export default class Effects3D {
	constructor(scene) {
		this.scene = scene;

	}

	load() {
	
		this.scene.getObjectByName('Glass0032').material = MATERIAL_GLASS;
		this.scene.getObjectByName('Glass0032001').material = MATERIAL_GLASS;
		this.scene.getObjectByName('Glass001').material = MATERIAL_GLASS;
		this.scene.getObjectByName('Glass002').material = MATERIAL_GLASS;
		this.scene.getObjectByName('Glass003').material = MATERIAL_GLASS;
		this.scene.getObjectByName('Glass004').material = MATERIAL_GLASS;
		this.scene.getObjectByName('Glass005').material = MATERIAL_GLASS;

		// this.scene.getObjectByName('Cube542_1').material = this.material1;


		var sleepingMirrorGeometry = new THREE.PlaneGeometry( 0.5, 1.05 );
		var sleepingMirror = new Reflector( sleepingMirrorGeometry, {
			clipBias: 0.003,
			textureWidth: window.innerWidth * window.devicePixelRatio,
			textureHeight: window.innerHeight * window.devicePixelRatio ,
			color: 0x889999
		} );
		sleepingMirror.position.set(0.926,1.02,1.3);
		sleepingMirror.rotation.set(0,-1.57,0);
		this.scene.add( sleepingMirror );

		var bathMirrorGeometry = new THREE.PlaneGeometry( 0.85, 0.7 );
		var bathMirror = new Reflector( bathMirrorGeometry, {
			clipBias: 0.003,
			textureWidth: window.innerWidth * window.devicePixelRatio,
			textureHeight: window.innerHeight * window.devicePixelRatio ,
			color: 0x889999
		} );
		bathMirror.position.set(1.08,1.3,0.95);
		bathMirror.rotation.set(0,1.57,0);
		this.scene.add( bathMirror );

		var diningMirrorGeometry = new THREE.PlaneGeometry( 0.5, 0.45 );
		var diningMirror = new Reflector( diningMirrorGeometry, {
			clipBias: 0.003,
			textureWidth: window.innerWidth * window.devicePixelRatio,
			textureHeight: window.innerHeight * window.devicePixelRatio ,
			color: 0x889999
		} );
		diningMirror.position.set(0.99,1.28,-0.08);
		diningMirror.rotation.set(0,3.14,0);
		this.scene.add( diningMirror );


window.mirror = diningMirror;
		return null;

	}

}


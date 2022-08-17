
import * as THREE from 'three'
import { GLTFLoader } from '/js/three/jsm/loaders/GLTFLoader.js';

class SceneLoader {
	constructor (scene, loadedCallback) {
		this.loader = new GLTFLoader(); 
		this.scene = scene;
		this.loadedCallback = loadedCallback;
		this.fragments = {};
	}


	setOpacity(obj, opacity) {
	  obj.traverse(child => {
	    if (child instanceof THREE.Mesh) {
	      child.material.opacity = opacity;
	      child.material.transparent = true;
	    }
	  });
	}


	loadGlTF(item) {
		var that = this;
		console.log(`Loading "${item.name}" from  "${item.file}"`);
		this.loader.load( item.file, 
			function ( gltf ) { 
				if(item.position) {
					gltf.scene.position.set( item.position.x, item.position.y, item.position.z );
				}
				if(item.rotation) {
					gltf.scene.rotation.set( item.rotation.x, item.rotation.y, item.rotation.z );
				}
				if(item.scale) {
					gltf.scene.scale.set( item.scale.x, item.scale.y, item.scale.z );
				}

				if(typeof item.opacity !== 'undefined') {
					that.setOpacity( gltf.scene , item.opacity);
				} 


        gltf.scene.traverse( function ( child ) {

          if ( child.isMesh ) {

            child.material.flatShading = THREE.SmoothShading;
            child.castShadow = true;
            child.receiveShadow = true;

          }

        });

				that.scene.add( gltf.scene );

				if(that.loadedCallback) {
					that.loadedCallback({'name': item.name, 'item': gltf.scene});
				}
			}, 	
			function ( xhr ) {
				console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
			},
			function ( error ) { 
				console.error( error ); 
			}
		);

	}

	async loadFragment(item) {
		console.log(`Loading fragment "${item.name}" from  "${item.file}"`);

		var that = this;
		if(! that.fragments.hasOwnProperty(item.name)){

			const MyClassObj = await import("/js/static/" + item.file); 
			var MyClass = MyClassObj.default;
			var newObj = new MyClass(that.scene);
			that.fragments[item.name] = newObj;
   			var newSceneObj = newObj.load();
   			that.loadedCallback({'name': item.name, 'item': newSceneObj});

		} else {
			 console.error(`fragment item ${item.name} already loaded - ignoreing load it twice`);
		}

	}

	load(item) { 
		if(item.ignore) { return; }
		if(item.type === 'gltf') {
			this.loadGlTF(item);
		} else if(item.type === 'fragment') {
			this.loadFragment(item);

		} else { console.error(`unsupported type: "${item.type}"`);}
	}

}
export { SceneLoader };

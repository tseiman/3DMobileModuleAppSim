
import * as THREE from 'three'
import { TWEEN } from '/js/three/jsm/libs/tween.module.min.js';


class AnimationManager {

	constructor (camera, controls) {
		this.camera = camera;
		this.controls = controls;
		this.animationSequence = [];
		this.animationStep = 0;
		this.animateableItems = {};
	}

	pushNewItem(name,item) {
		this.animateableItems[name] = item;
	}

	set animation(animation) {
		this.animationSequence = animation;
	}

	get animation() {
		return this.animationSequence;
	}

	getNextAnimation() {
		if(!this.animationSequence[this.animationStep]) { return false; }
		var result = this.animationSequence[this.animationStep];
		++this.animationStep;
		return result;
	}


	resetAnimation() {
		this.animationStep = 0;
	}

	getItem(name) {
		return this.animateableItems[name];
	}

	getItemState(name) {
		var result = {};

		if(this.animateableItems[name].position) {
			result['position'] = this.animateableItems[name].position;
		}
		if(this.animateableItems[name].rotation) {
			result['rotation'] = this.animateableItems[name].rotation;
		}
		if(this.animateableItems[name].scale) {
			result['scale'] = this.animateableItems[name].scale;
		}




		return result;
	}

	async animate(item,actualAnimationPoint,newAnimationPoint) {
		return new Promise(function(resolve, reject) {
			if(newAnimationPoint.position) {
				var posCoords = { 'x': actualAnimationPoint.position.x ,'y': actualAnimationPoint.position.y, 'z': actualAnimationPoint.position.z};
				new TWEEN.Tween(posCoords).to(newAnimationPoint.position).onUpdate(() => {
		    		item.position.set(posCoords.x, posCoords.y, posCoords.z)
				}).easing(TWEEN.Easing.Quadratic.InOut).start().onComplete(function() {
							resolve();
				});
			}
			if(newAnimationPoint.rotation) {
					var rotCoords = { 'x': actualAnimationPoint.rotation.x ,'y': actualAnimationPoint.rotation.y, 'z': actualAnimationPoint.rotation.z};	  
				new TWEEN.Tween(rotCoords).to(newAnimationPoint.rotation).onUpdate(() => {
		    		item.rotation.set(rotCoords.x, rotCoords.y, rotCoords.z);
				}).easing(TWEEN.Easing.Quadratic.InOut).start().onComplete(function() {
							resolve();
				});
			}
			if((!newAnimationPoint.rotation) && (! newAnimationPoint.position)) resolve();
			
		});
	} 



	async animateCamera(newAnimationPoint) {
		var that = this;
		return new Promise(function(resolve, reject) {
			var actualAnimationPoint = {"position" : that.camera.position, "rotation": that.camera.rotation, "target": that.controls.target};

			that.animate(that.camera,actualAnimationPoint,newAnimationPoint);

			if(newAnimationPoint.target) {
					var targetCoords = { 'x': actualAnimationPoint.target.x ,'y': actualAnimationPoint.target.y, 'z': actualAnimationPoint.target.z};
				new TWEEN.Tween(targetCoords).to(newAnimationPoint.target).onUpdate(() => {
		    		that.controls.target.set(targetCoords.x, targetCoords.y, targetCoords.z)
				}).easing(TWEEN.Easing.Quartic.InOut).start().onComplete(function() {
							resolve();
				});
			}

		});

	}
	async animateItem(item) {
		var that = this;

		return new Promise(async function(resolve, reject) {
			var actualAnimationPoint = {"position" : that.animateableItems[item.item].position, "rotation": that.animateableItems[item.item].rotation};

			await that.animate(that.animateableItems[item.item],actualAnimationPoint,{"position" : item.position, "rotation": item.rotation});

			if(typeof item.opacity !== 'undefined') {
				var opacity = 1;
				that.animateableItems[item.item].traverse(child => {
		    		if (child instanceof THREE.Mesh) {
		      			opacity = child.material.opacity;
		      			child.material.transparent = true;
		    		}
		  		});
				that.animateableItems[item.item].traverse(child => {
		    		if (child instanceof THREE.Mesh) {
		    			var oldOpacity = {'x': opacity, 'y': 0};
		    			new TWEEN.Tween(oldOpacity).to({'x': item.opacity, 'y': 0}).onUpdate(() => {

		    				that.animateableItems[item.item].traverse(child => {
		    					if (child instanceof THREE.Mesh) {
		      						child.material.opacity = oldOpacity.x;
		    					}
		  					});

						}).easing(TWEEN.Easing.Quartic.InOut).start().onComplete(function() {
							resolve();
						});

		    		}
		  		});
			} else {
				resolve();
			}

		});
		






	}
	async animateTexture(itemToUpdate,materialNameToUpdate,newTexture,callback) {

		this.getItem(itemToUpdate).traverse(child => {

			if (child.material && child.material.name === materialNameToUpdate) {

				var oldOpacity = {'x': 1, 'y': 0};
				var newOpacity = {'x': 0, 'y': 0};
				return new Promise(function(resolve, reject) {
					new TWEEN.Tween(oldOpacity).to(newOpacity).onUpdate(() => {

						child.material = new THREE.MeshPhongMaterial({
							color: 0xFFFFFF,
						    opacity: oldOpacity.x,
						    transparent: true,
						});

					}).easing(TWEEN.Easing.Sinusoidal.InOut).start().onComplete(function() {
						var oldOpacity = {'x': 0, 'y': 0};
						var newOpacity = {'x': 1, 'y': 0};
					
						new TWEEN.Tween(oldOpacity).to(newOpacity).onUpdate(() => {		
							child.material = new THREE.MeshPhongMaterial({
							    color: 0xFFFFFF,
							    opacity: oldOpacity.x,
							    transparent: true,
				 			});
						}).easing(TWEEN.Easing.Sinusoidal.InOut).start().onComplete(function() {
							child.material = new THREE.MeshPhongMaterial({
				   				color: 0xc0c0c0,
				    			opacity: 0,
				    			transparent: false,
				  			});
							child.material.map = new THREE.TextureLoader().load(newTexture, function(texture) {
								if(callback) callback(texture);
							});
							child.material.name = materialNameToUpdate;
							child.material.map.flipY = false;
							child.material.map.repeat.set(1.25, 1.25);
							child.material.map.offset.set(-0.115, -0.12);
							resolve();
						});
					});

				});
			}
		});
	}



}
export { AnimationManager };

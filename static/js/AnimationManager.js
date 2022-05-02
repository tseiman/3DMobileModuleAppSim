
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

	animate(item,actualAnimationPoint,newAnimationPoint) {
		if(newAnimationPoint.position) {
			var posCoords = { 'x': actualAnimationPoint.position.x ,'y': actualAnimationPoint.position.y, 'z': actualAnimationPoint.position.z};
			new TWEEN.Tween(posCoords).to(newAnimationPoint.position).onUpdate(() => {
	    		item.position.set(posCoords.x, posCoords.y, posCoords.z)
			}).easing(TWEEN.Easing.Sinusoidal.InOut).start();
		}

		if(newAnimationPoint.rotation) {
				var rotCoords = { 'x': actualAnimationPoint.rotation.x ,'y': actualAnimationPoint.rotation.y, 'z': actualAnimationPoint.rotation.z};	  
			new TWEEN.Tween(rotCoords).to(newAnimationPoint.rotation).onUpdate(() => {
	    		item.rotation.set(rotCoords.x, rotCoords.y, rotCoords.z)
			}).easing(TWEEN.Easing.Sinusoidal.InOut).start();
		}
	} 



	animateCamera(newAnimationPoint) {

		var actualAnimationPoint = {"position" : this.camera.position, "rotation": this.camera.rotation, "target": this.controls.target};

		this.animate(this.camera,actualAnimationPoint,newAnimationPoint);

		if(newAnimationPoint.target) {
				var targetCoords = { 'x': actualAnimationPoint.target.x ,'y': actualAnimationPoint.target.y, 'z': actualAnimationPoint.target.z};
			new TWEEN.Tween(targetCoords).to(newAnimationPoint.target).onUpdate(() => {
	    		this.controls.target.set(targetCoords.x, targetCoords.y, targetCoords.z)
			}).easing(TWEEN.Easing.Quartic.InOut).start();
		}

	}
	animateItem(item) {
		var that = this;

		var actualAnimationPoint = {"position" : this.animateableItems[item.item].position, "rotation": this.animateableItems[item.item].rotation};

		if(typeof item.opacity !== 'undefined') {
			var opacity = 1;
			this.animateableItems[item.item].traverse(child => {
	    		if (child instanceof THREE.Mesh) {
	      			opacity = child.material.opacity;
	      			child.material.transparent = true;
	    		}
	  		});
			this.animateableItems[item.item].traverse(child => {
	    		if (child instanceof THREE.Mesh) {
	    			var oldOpacity = {'x': opacity, 'y': 0};
	    			new TWEEN.Tween(oldOpacity).to({'x': item.opacity, 'y': 0}).onUpdate(() => {

	    				that.animateableItems[item.item].traverse(child => {
	    					if (child instanceof THREE.Mesh) {
	      						child.material.opacity = oldOpacity.x;
	    					}
	  					});

					}).easing(TWEEN.Easing.Quartic.InOut).start().onComplete(function() {

						console.log("here next");
					});

	    		}
	  		});

		}
		


		this.animate(this.animateableItems[item.item],actualAnimationPoint,{"position" : item.position, "rotation": item.rotation});




	}



}
export { AnimationManager };

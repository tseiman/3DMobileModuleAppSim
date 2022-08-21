import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from '/js/three/jsm/renderers/CSS2DRenderer.js';

export default class Switches {
	constructor(scene, context, subLoadPercentCallback) {
		this.scene = scene;
		this.context = context;
		this.subLoadPercentCallback = subLoadPercentCallback;
	}

	load() {
		var that = this;
		var lights = [];


		this.scene.traverse( function ( node ) { 
		    if (node.isLight && node.type==="PointLight" && node.parent.name !== "") {
		       lights.push(node);
		    }
		});

		var loadStepsPercent = 100 / lights.length;
		var subPercentLoaded = 0;

		lights.forEach( light => {
			
			var el = document.createElement( 'button' );
			el.className = 'label icon';
			el.id = 'label_' +  light.parent.name;
			el.innerHTML = '<i class="fa-thin fa-lightbulb switch-offstate" contextinfo="'+ light.parent.name + '"></i>';
			el.style.marginTop = '-1em';
			el.setAttribute('contextinfo', light.parent.name);
			if(typeof light.parent.userData.caption !== 'undefined') el.title = light.parent.userData.caption;
   
			var label = new CSS2DObject( el );
			label.position.set( 0,0.2,0);
	 		light.parent.add( label );
			label.layers.set( 0 ); 
			

			el.addEventListener('pointerdown', function(){
				//console.log( event.srcElement.getAttribute('contextinfo') ) ;
				that.context.toggleDevicePower(event.srcElement.getAttribute('contextinfo'));

			});


			light.parent.visible = false;

			that.context.registerDevice({'name': light.parent.name, 'state': false, 'power': light.intensity / 0.15, 'type' :  'light'});

			subPercentLoaded += loadStepsPercent;
		//	console.log(subPercentLoaded);
			this.subLoadPercentCallback(subPercentLoaded);
			
		});

		return null;

	}

}


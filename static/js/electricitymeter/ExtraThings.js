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


		var things = [
			{'name': 'stove', 		'tooltip': 'Kitchen - Stove', 			'power': 4210, 	'parent': 'Oven001', 		'icon': 'fa-thin fa-kitchen-set', 'pos': {x: -0.3,y: 0.8,z: 0.1 }},
			{'name': 'kettle', 		'tooltip': 'Kitchen - Kettle', 			'power': 981, 	'parent': 'Kettle1001', 	'icon': 'fa-thin fa-mug-hot', 'pos': {x: 0.8,y: 0.8,z: 0 }},
			{'name': 'toaster', 	'tooltip': 'Kitchen - Toaster', 		'power': 402, 	'parent': 'Toaster001', 	'icon': 'fa-thin fa-bread-slice', 'pos': {x: 0.45,y: 0.8,z: 0 }},
			{'name': 'microwave', 	'tooltip': 'Kitchen - Microwave Oven', 	'power': 1102, 	'parent': 'Microvawe001', 	'icon': 'fa-thin fa-bowl-rice', 'pos': {x: 0,y: 7,z: -2 }}
		];
			


		var loadStepsPercent = 100 / things.length;
		var subPercentLoaded = 0;

		things.forEach( thing => {

			var el = document.createElement( 'button' );
			el.className = 'label icon';
			el.id = 'label_' + thing.name;
			el.innerHTML = '<i class="' + thing.icon +' switch-offstate" contextinfo="' + thing.name + '"></i>';
			el.style.marginTop = '-1em';
			el.setAttribute('contextinfo', thing.name);
			el.title = thing.tooltip;

			var label = new CSS2DObject( el );
			label.position.set( thing.pos.x,thing.pos.y,thing.pos.z);
	 		that.scene.getObjectByName(thing.parent).add( label );
			label.layers.set( 0 ); 

			el.addEventListener('pointerdown', function(){
				//console.log( event.srcElement.getAttribute('contextinfo') ) ;
				that.context.toggleDevicePower(event.srcElement.getAttribute('contextinfo'));

			});
			that.context.registerDevice({'name': thing.name, 'state': false, 'power': thing.power, 'type' :  'extra'});

			subPercentLoaded += loadStepsPercent;
			this.subLoadPercentCallback(subPercentLoaded);
		});

		return null;

	}

}


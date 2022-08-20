import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from '/js/three/jsm/renderers/CSS2DRenderer.js';

export default class Switches {
	constructor(scene, context) {
		this.scene = scene;
		this.context = context;
	}

	load() {
		var that = this;

		this.scene.traverse( function ( node ) { 
		    if (node.isLight && node.type==="PointLight" && node.parent.name !== "") {
		        
		        var el = document.createElement( 'button' );
				el.className = 'label icon';
				el.id = 'label_' +  node.parent.name;
				el.innerHTML = '<i class="fa fa-power-off" contextinfo="'+ node.parent.name + '"></i>';
				el.style.marginTop = '-1em';
				el.setAttribute('contextinfo', node.parent.name);

       
				var label = new CSS2DObject( el );
				label.position.set( 0,0.2,0);
		 		node.parent.add( label );
				label.layers.set( 0 ); 
				

				el.addEventListener('pointerdown', function(){
					console.log( event.srcElement.getAttribute('contextinfo') ) ;
/*					let light = that.scene.getObjectByName(event.srcElement.getAttribute('contextinfo'));
					light.visible = !light.visible;
					*/
					that.context.toggleDevicePower(event.srcElement.getAttribute('contextinfo'));

				});


				node.parent.visible = false;

				that.context.registerDevice({'name': node.parent.name, 'state': false, 'power': node.intensity / 0.15});
		        
		    }
		});


		return null;

	}

}


import * as THREE from 'three';


export default class Spline2 {
    constructor(scene) {
        this.scene = scene;
    }

    load() {


        //Create a closed wavey loop
        const curve = new THREE.CatmullRomCurve3( [
           new THREE.Vector3(-0.2817970187466712,  1.6181460418857323,  3.727994652845991),
           new THREE.Vector3(-1.2691553184587454, 3.610683186024481, 3.022399747439268),
           new THREE.Vector3(-1.483413494869174, 3.81, -0.09182686968755394)
        ] );

        const points = curve.getPoints( 50 );
     


       const geometry = new THREE.BufferGeometry().setFromPoints( points );

        const material = new THREE.LineBasicMaterial({ color: 0xff0000,transparent: true, opacity: 1 });
        // Create the final object to add to the scene
        const curveObject = new THREE.Line( geometry, material );
        this.scene.add(curveObject);
        return curveObject;

    }

}



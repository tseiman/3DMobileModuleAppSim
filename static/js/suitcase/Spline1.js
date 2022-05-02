import * as THREE from 'three';

import { MeshLine, MeshLineMaterial } from 'three.meshline';

export default class Spline1 {
    constructor(scene) {
        this.scene = scene;
    }

    load() {
    // smooth my curve over this many points
 /*       var numPoints = 100;

        var spline = new THREE.SplineCurve3([
           new THREE.Vector3(-0.369, 1.423, 3.800),
           new THREE.Vector3(-2.912, 2.678, 0.973),
        ]);

        var material = new THREE.LineBasicMaterial({
            color: 0xff00f0,
        });

        var geometry = new THREE.Geometry();
        var splinePoints = spline.getPoints(numPoints);

        for(var i = 0; i < splinePoints.length; i++){
            geometry.vertices.push(splinePoints[i]);  
        }

        var line = new THREE.Line(geometry, material);
        this.scene.add(line);
        return line;

*/

        //Create a closed wavey loop
        const curve = new THREE.CatmullRomCurve3( [
           new THREE.Vector3(-0.369, 1.423, 3.800),
           new THREE.Vector3(-2.3267805750693507, 2.6934740936698307, 3.033763337092553),
           new THREE.Vector3(-2.912, 2.678, 0.973)
        ] );

        const points = curve.getPoints( 50 );
     
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new MeshLine();
        line.setPoints(points);

         const material = new MeshLineMaterial( {
                        color: new THREE.Color( "rgb(2, 255, 2)" ),
                        opacity: 0,
                        sizeAttenuation: 1,
                        lineWidth: 0.05,
                        transparent: true,
                        side: THREE.DoubleSide
                    });

         const mesh = new THREE.Mesh(line, material);

      //  line.setGeometry(geometry);

        this.scene.add(mesh);
        return mesh;

     /*   const geometry = new THREE.BufferGeometry().setFromPoints( points );

        const material = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            linewidth: 1000, });
        // Create the final object to add to the scene
        const curveObject = new THREE.Line( geometry, material );
        this.scene.add(curveObject);
        return curveObject;
*/
    }

}



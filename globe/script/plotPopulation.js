
var x_values = [];
var y_values = [];
var z_values = [];


function drawTHREEGeoPopulation(json, radius, shape, scene) {

  var json_geom = createGeometryArray(json);
  var convertCoordinates = getConversionFunctionName(shape);
  for (var geom_num = 0; geom_num < 10; geom_num++) {

    // if (geom_num !== 17) continue;
    // if (geom_num > 10) break;

    if (json_geom[geom_num].type == 'Point') {
      let lat = json_geom[geom_num].coordinates[0];
      let lon = json_geom[geom_num].coordinates[1];
      //convertCoordinates(json_geom[geom_num].coordinates, radius);

      //drawParticle(y_values[0], z_values[0], x_values[0], scene);
      //var pop = json.features[geom_num].properties.data["2019"];
      if(json.features[geom_num].properties.data) {
        let pop = json.features[geom_num].properties.data['2019']
        let rounded = Math.round(pop / 1000000);

        var edge = Math.round(rounded / 6);
        var cells = hexGrid(edge);

        for (let k = 0; k < cells.length; k++) {
          convertCoordinates([lat+cells[k].x / 4, lon+cells[k].y / 4], radius);

        }
        //convertCoordinates([lat,lon], radius);


        for (let j = 0; j < x_values.length; j++) {
          drawBox(y_values[j], z_values[j], x_values[j], pop, scene);
        }

        clearArrays();

      }


    } else if (json_geom[geom_num].type == 'MultiPoint') {
      for (let point_num = 0; point_num < json_geom[geom_num].coordinates.length; point_num++) {
        convertCoordinates(json_geom[geom_num].coordinates[point_num], radius);
        drawParticle(y_values[0], z_values[0], x_values[0], scene);
      }

    } else if (json_geom[geom_num].type == 'LineString') {
      for (let point_num = 0; point_num < json_geom[geom_num].coordinates.length; point_num++) {
        convertCoordinates(json_geom[geom_num].coordinates[point_num], radius);
      }
      drawLine(y_values, z_values, x_values, scene);

    } else if (json_geom[geom_num].type == 'Polygon') {
      for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {
        let coords = json_geom[geom_num].coordinates[segment_num];
        for (let j = 0; j < coords.length; j++) {
          convertToSphereCoords(coords[j], radius);
        }
        drawLine(y_values, z_values, x_values, scene);
      }

    } else if (json_geom[geom_num].type == 'MultiLineString') {
      for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {
        let coords = json_geom[geom_num].coordinates[segment_num];
        for (let point_num = 0; point_num < coords.length; point_num++) {
          convertCoordinates(json_geom[geom_num].coordinates[segment_num][point_num], radius);
        }
        drawLine(y_values, z_values, x_values, scene);
      }

    } else if (json_geom[geom_num].type == 'MultiPolygon') {
      for (let polygon_num = 0; polygon_num < json_geom[geom_num].coordinates.length; polygon_num++) {
        for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates[polygon_num].length; segment_num++) {
          let coords = json_geom[geom_num].coordinates[polygon_num][segment_num];
          for (let j = 0; j < coords.length; j++) {
            convertToSphereCoords(coords[j], radius);
          }

          drawLine(y_values, z_values, x_values, scene);
        }
      }
    } else {
      throw new Error('The geoJSON is not valid.');
    }
  }

}





function hexGrid(edgeLength){
	var len = 2 * edgeLength - 1;
  var vx = Math.sin(Math.PI/6);
  var vy = Math.cos(Math.PI/6);
	var tl = edgeLength - 1;
  var br = 3*edgeLength - 2;
	var positions = [];

  for(var y = 0; y < len; ++y){
		for(var x = 0; x < len; ++x){

			if(x+y < tl || x+y >= br) continue;
			positions.push({x: vx*y + x, y: vy*y});
		}
	}
	return positions;
}


function drawParticle(x, y, z, scene) {
  var particle_geom = new THREE.Geometry();
  particle_geom.vertices.push(new THREE.Vector3(x, y, z));
  var particle_material = new THREE.PointsMaterial();
  var particle = new THREE.Points(particle_geom, particle_material);
  scene.add(particle);

  clearArrays();
}

function createVertexForEachPoint(object_geometry, values_axis1, values_axis2, values_axis3) {
  for (var i = 0; i < values_axis1.length; i++) {
    object_geometry.vertices.push(new THREE.Vector3(values_axis1[i], values_axis2[i], values_axis3[i]));
  }
}


function drawBox(x, y, z, pop, scene) {

  let rounded = Math.round(pop / 1000000);
  let geometry = new THREE.CylinderGeometry(0.5, 0.5, rounded, 6, 6);
  geometry.translate(0, rounded/2, 0);

  let material= new THREE.MeshBasicMaterial({
    color: 0xFC826F
  });
  let baseV = new THREE.Vector3(0, 1, 0);
  let dirV = new THREE.Vector3();

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.quaternion.setFromUnitVectors(baseV, dirV.copy(mesh.position).normalize());
  scene.add(mesh);

}

function scaleY ( mesh, scale ) {
  mesh.scale.y = scale ;
  if(!mesh.geometry.boundingBox ) mesh.geometry.computeBoundingBox();
  var height = mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y;
  //height is here the native height of the geometry
  //that does not change with scaling.
  //So we need to multiply with scale again
  mesh.position.y = -height * scale / 2 ;
}

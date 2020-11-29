
var x_values = [];
var y_values = [];
var z_values = [];

var progressEl = $("#progress");
var clickableObjects = [];

function drawThreeGeoBorder(json, radius, shape, scene) {
  var json_geom = createGeometryArray(json);
  var convertCoordinates = getConversionFunctionName(shape);
  var t0 = performance.now();
  for (var geom_num = 0; geom_num < json_geom.length; geom_num++) {


    // if (geom_num !== 17) continue;
    // if (geom_num > 10) break;

    if (json_geom[geom_num].type == 'Point') {
      convertCoordinates(json_geom[geom_num].coordinates, radius);
      drawParticle(y_values[0], z_values[0], x_values[0], scene);

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

  var t1 = performance.now();
  console.log("Call to drawBorder took " + (t1 - t0) + " milliseconds.");
}


function drawParticle(x, y, z, scene) {


  var particle_geom = new THREE.Geometry();
  particle_geom.vertices.push(new THREE.Vector3(x, y, z));
  var particle_material = new THREE.ParticleSystemMaterial();
  var particle = new THREE.ParticleSystem(particle_geom, particle_material);
  scene.add(particle);

  clearArrays();
}

function drawLine(x_values, y_values, z_values, scene) {
  // i think it converts all the coordinates to work for mesh
  //so they arent really border coordinates anyomore

  var line_geom = new THREE.Geometry();
  createVertexForEachPoint(line_geom, x_values, y_values, z_values);
  var line_material = new THREE.LineBasicMaterial({
    color: 0xe0fbfc
  });
  line_material.linewidth = 2;
  var line = new THREE.Line(line_geom, line_material);
  //let lineMesh = new THREE.Mesh(line_geom, line_material);
  scene.add(line);

  clearArrays();
}

function createVertexForEachPoint(object_geometry, values_axis1, values_axis2, values_axis3) {
  for (var i = 0; i < values_axis1.length; i++) {
    object_geometry.vertices.push(new THREE.Vector3(values_axis1[i], values_axis2[i], values_axis3[i]));
  }
}

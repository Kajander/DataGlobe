let TRIANGULATION_DENSITY = 5;
let WIREFRAME = false;

function verts2array(coords) {
  let flat = [];
  for (let k = 0; k < coords.length; k++) {
    flat.push(coords[k][0], coords[k][1]);
  }
  return flat;
}

function array2verts(arr) {
  let coords = [];
  for (let k = 0; k < arr.length; k += 2) {
    coords.push([arr[k], arr[k + 1]]);
  }
  return coords;
}

function findBBox(points) {
  let min = {x: 1e99, y: 1e99};
  let max = {x: -1e99, y: -1e99};
  for (var point_num = 0; point_num < points.length; point_num++) {
    if (points[point_num][0] < min.x) {
      min.x = points[point_num][0];
    }
    if (points[point_num][0] > max.x) {
      max.x = points[point_num][0];
    }
    if (points[point_num][1] < min.y) {
      min.y = points[point_num][1];
    }
    if (points[point_num][1] > max.y) {
      max.y = points[point_num][1];
    }
  }
  return {min: min, max: max};
}

function isInside(point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point[0],
    y = point[1];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0],
      yi = vs[i][1];
    var xj = vs[j][0],
      yj = vs[j][1];

    var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function genInnerVerts(points) {
  let res = [];
  for (let k = 0; k < points.length; k++) {
    res.push(points[k]);
  }

  let bbox = findBBox(points);

  let step = TRIANGULATION_DENSITY;
  let k = 0;
  for (let x = bbox.min.x + step / 2; x < bbox.max.x; x += step) {
    for (let y = bbox.min.y + step / 2; y < bbox.max.y; y += step) {
      let newp = [x, y];
      if (isInside(newp, points)) {
        res.push(newp);
      }
      k++;
    }
  }

  return res;
}

function removeOuterTriangles(delaunator, points) {
  let newTriangles = [];
  for (let k = 0; k < delaunator.triangles.length; k += 3) {
    let t0 = delaunator.triangles[k];
    let t1 = delaunator.triangles[k + 1];
    let t2 = delaunator.triangles[k + 2];

    let x0 = delaunator.coords[2 * t0];
    let y0 = delaunator.coords[2 * t0 + 1];

    let x1 = delaunator.coords[2 * t1];
    let y1 = delaunator.coords[2 * t1 + 1];

    let x2 = delaunator.coords[2 * t2];
    let y2 = delaunator.coords[2 * t2 + 1];

    let midx = (x0 + x1 + x2) / 3;
    let midy = (y0 + y1 + y2) / 3;

    let midp = [midx, midy];
    if (isInside(midp, points)) {
      newTriangles.push(t0, t1, t2);
    }
  }
  delaunator.triangles = newTriangles;
}

var x_values = [];
var y_values = [];
var z_values = [];

var progressEl = $("#progress");
var clickableObjects = [];
var someColors = [0xE6B8A2, 0xDEAB90, 0xD69F7E, 0xCD9777, 0xC38E70, 0xB07D62];
var thisScene;


function drawThreeGeo(json, radius, shape, options, scene) {
  thisScene = scene;
  var json_geom = createGeometryArray(json);
  var json_property = createPropertyArray(json);

  var convertCoordinates = getConversionFunctionName(shape);
  var t0 = performance.now();
  for (var geom_num = 0; geom_num < json_geom.length; geom_num++) {
  //for (var geom_num = 0; geom_num < 1; geom_num++) {

    //console.log("Processing " + geom_num + " of " + json_geom.length + " shapes");

    // if (geom_num !== 17) continue;
    // if (geom_num > 10) break;

    if (json_geom[geom_num].type == 'Point') {
      convertCoordinates(json_geom[geom_num].coordinates, radius);
      drawParticle(y_values[0], z_values[0], x_values[0], options);

    } else if (json_geom[geom_num].type == 'MultiPoint') {
      for (let point_num = 0; point_num < json_geom[geom_num].coordinates.length; point_num++) {
        convertCoordinates(json_geom[geom_num].coordinates[point_num], radius);
        drawParticle(y_values[0], z_values[0], x_values[0], options);
      }

    } else if (json_geom[geom_num].type == 'LineString') {

      for (let point_num = 0; point_num < json_geom[geom_num].coordinates.length; point_num++) {
        convertCoordinates(json_geom[geom_num].coordinates[point_num], radius);
      }
      drawLine(y_values, z_values, x_values, options);

    } else if (json_geom[geom_num].type == 'Polygon') {

      let group = createGroup(geom_num);
      group.name = json_property[geom_num];
      let randomColor = someColors[Math.floor(someColors.length * Math.random())];

      for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {

        let coords = json_geom[geom_num].coordinates[segment_num];
        let refined = genInnerVerts(coords);
        let flat = verts2array(refined);
        let d = new Delaunator(flat);
        removeOuterTriangles(d, coords);
        let delaunayVerts = array2verts(d.coords);

        for (let point_num = 0; point_num < delaunayVerts.length; point_num++) {
          // convertCoordinates(refined[point_num], radius);
          convertCoordinates(delaunayVerts[point_num], radius);
        }

        drawMesh(group, y_values, z_values, x_values, d.triangles, randomColor, name);
      }

    } else if (json_geom[geom_num].type == 'MultiLineString') {
      for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {
        let coords = json_geom[geom_num].coordinates[segment_num];
        for (let point_num = 0; point_num < coords.length; point_num++) {
          convertCoordinates(json_geom[geom_num].coordinates[segment_num][point_num], radius);
        }
        drawLine(y_values, z_values, x_values);
      }

    } else if (json_geom[geom_num].type == 'MultiPolygon') {

      let group = createGroup(geom_num);
      group.name = json_property[geom_num];
      let randomColor = someColors[Math.floor(someColors.length * Math.random())];

      for (let polygon_num = 0; polygon_num < json_geom[geom_num].coordinates.length; polygon_num++) {
        for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates[polygon_num].length; segment_num++) {

          let coords = json_geom[geom_num].coordinates[polygon_num][segment_num];
          let refined = genInnerVerts(coords);
          let flat = verts2array(refined);
          let d = new Delaunator(flat);
          removeOuterTriangles(d, coords);
          let delaunayVerts = array2verts(d.coords);

          for (let point_num = 0; point_num < delaunayVerts.length; point_num++) {
            // convertCoordinates(refined[point_num], radius);
            convertCoordinates(delaunayVerts[point_num], radius);
          }
          drawMesh(group, y_values, z_values, x_values, d.triangles, randomColor)
        }
      }
    } else {
      throw new Error('The geoJSON is not valid.');
    }

  }


  var t1 = performance.now();
  console.log("Call to drawArea took " + (t1 - t0) + " milliseconds.");
}


function drawParticle(x, y, z, options) {
  var particle_geom = new THREE.Geometry();
  particle_geom.vertices.push(new THREE.Vector3(x, y, z));

  var particle_material = new THREE.ParticleSystemMaterial(options);

  var particle = new THREE.ParticleSystem(particle_geom, particle_material);
  thisScene.add(particle);

  clearArrays();
}

function createGroup(idx) {
  var group = new THREE.Group();
  group.userData.userText = "_" + idx;
  thisScene.add(group);
  return group;
}

function drawMesh(group, x_values, y_values, z_values, triangles, color) {
  var geometry = new THREE.Geometry();

  for (let k = 0; k < x_values.length; k++) {
    geometry.vertices.push(new THREE.Vector3(x_values[k], y_values[k], z_values[k]));
  }

  for (let k = 0; k < triangles.length; k += 3) {
    geometry.faces.push(new THREE.Face3(triangles[k], triangles[k + 1], triangles[k + 2]));
  }

  geometry.computeVertexNormals();
  let material = new THREE.MeshBasicMaterial({
    //side: THREE.DoubleSide,
    side: THREE.BackSide,
    color: color,
    wireframe: WIREFRAME
  });


  let mesh = new THREE.Mesh(geometry, material);
  clickableObjects.push(mesh);
  group.add(mesh);

  clearArrays();
}

function createVertexForEachPoint(object_geometry, values_axis1, values_axis2, values_axis3) {
  for (var i = 0; i < values_axis1.length; i++) {
    object_geometry.vertices.push(new THREE.Vector3(values_axis1[i], values_axis2[i], values_axis3[i]));
  }
}

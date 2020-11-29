
function convertToSphereCoords(coordinates_array, sphere_radius) {
  let lon = coordinates_array[0];
  let lat = coordinates_array[1];

  x_values.push(Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180) * sphere_radius);
  y_values.push(Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180) * sphere_radius);
  z_values.push(Math.sin(lat * Math.PI / 180) * sphere_radius);
}

function convertSingleLatLonToSphereCoords(coordinates_array, sphere_radius) {
  let lon = coordinates_array[0];
  let lat = coordinates_array[1];

  let x_value = Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180) * sphere_radius;
  let y_value = Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180) * sphere_radius;
  let z_value = Math.sin(lat * Math.PI / 180) * sphere_radius;

  return {x:x_value, y:y_value, z:z_value};
}


function convertToPlaneCoords(coordinates_array, radius) {
  let lon = coordinates_array[0];
  let lat = coordinates_array[1];
  let plane_offset = radius / 2;

  z_values.push((lat / 180) * radius);
  y_values.push((lon / 180) * radius);

}

function getConversionFunctionName(shape) {
  let conversionFunctionName;

  if (shape == 'sphere') {
    conversionFunctionName = convertToSphereCoords;
  } else if (shape == 'plane') {
    conversionFunctionName = convertToPlaneCoords;
  } else {
    throw new Error('The shape that you specified is not valid.');
  }
  return conversionFunctionName;
}

function createGeometryArray(json) {
  let geometry_array = [];

  if (json.type == 'Feature') {
    geometry_array.push(json.geometry);
  } else if (json.type == 'FeatureCollection') {
    for (let feature_num = 0; feature_num < json.features.length; feature_num++) {
      geometry_array.push(json.features[feature_num].geometry);
    }
  } else if (json.type == 'GeometryCollection') {
    for (let geom_num = 0; geom_num < json.geometries.length; geom_num++) {
      geometry_array.push(json.geometries[geom_num]);
    }
  } else {
    throw new Error('The geoJSON is not valid.');
  }
  //alert(geometry_array.length);
  return geometry_array;
}

function createPropertyArray(json) {
  let property_array = [];
  if (json.type == 'FeatureCollection') {
    for (let feature_num = 0; feature_num < json.features.length; feature_num++) {
      property_array.push(json.features[feature_num].properties.name);
    }
  } else {
    throw new Error('The geoJson is not valid.');
  }
  return property_array;
}

function clearArrays() {
  x_values.length = 0;
  y_values.length = 0;
  z_values.length = 0;
}

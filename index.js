let MarkerArray = []
let black_markers = []
let red_markers = []
let coord_pairs = []
let midpoints = []
black_marker = true;



let route_geojson = null;

function coords_dist(coords1, coords2) {

  // convert degrees to rads
  var lon1 = coords1['lng'] * Math.PI / 180;
  var lon2 = coords2['lng'] * Math.PI / 180;
  var dLon = lon2 - lon1;
  var lat1 = coords1['lat'] * Math.PI / 180;
  var lat2 = coords2['lat'] * Math.PI / 180;
  var dLat = lat2 - lat1;
  var radius = 6371000;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1) * Math.cos(lat2) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return radius * c;
};

function zoom_scale(accuracy)
{
  var scale = accuracy / 250;
  scale = Math.round(scale);

  if(scale > 4) scale = 4;

  added_zoom = 4 - scale;

  return 9 + added_zoom;
}


var options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function success(pos) {
  var crd = pos.coords;

  initMap(pos.coords);
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
  let coords = null;
  initMap(coords);
}


navigator.geolocation.getCurrentPosition(success, error, options);

function initMap(coords)
{
  let lng = 0;
  let lat = 0;
  let zoom = 1;
  if(coords != null)
  {
    lng = coords['longitude'];
    lat = coords['latitude'];
    zoom =  zoom_scale(coords['accuracy']);
  }

  mapboxgl.accessToken = 'pk.eyJ1IjoibWVzaWNzbWF0eWkiLCJhIjoiY2swM2pndWttMGE0ZjNtcDU0Yjc1ejF0YiJ9.QTpGLoEnNwVb6lR1xab2NQ';
  map = new mapboxgl.Map({
  container: 'map', // container ID
  style: 'mapbox://styles/mapbox/cjaudgl840gn32rnrepcb9b9g', // style URL
  center: [lng, lat], // starting position [lng, lat]
  zoom: zoom // starting zoom
  });

  map.on('load', () => {
    map.addSource('dem', {
    'type': 'raster-dem',
    'url': 'mapbox://mapbox.mapbox-terrain-dem-v1'
    });
    map.addLayer(
    {
    'id': 'hillshading',
    'source': 'dem',
    'type': 'hillshade'
    // insert below waterway-river-canal-shadow;
    // where hillshading sits in the Mapbox Outdoors style
    },
    'waterway-river-canal-shadow'
    );
  });
  
  map.on('click', (e) => {

    MarkerArray.push(e.lngLat.wrap());
    if(black_marker == true)
    {
      black_markers.push(e.lngLat.wrap());
      new mapboxgl.Marker({ color: 'black'})
        .setLngLat([e.lngLat.wrap()['lng'],e.lngLat.wrap()['lat']])
        .addTo(map);
      black_marker = false;

    }
    else
    {
      red_markers.push(e.lngLat.wrap());
      new mapboxgl.Marker({ color: 'red'})
        .setLngLat([e.lngLat.wrap()['lng'],e.lngLat.wrap()['lat']])
        .addTo(map);
      black_marker = true;
    }
  });

  const coordinatesGeocoder = function (query) {
    // Match anything which looks like
    // decimal degrees coordinate pair.
    const matches = query.match(
    /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
    );
    if (!matches) {
    return null;
    }
    
    function coordinateFeature(lng, lat) {
    return {
    center: [lng, lat],
    geometry: {
    type: 'Point',
    coordinates: [lng, lat]
    },
    place_name: 'Lat: ' + lat + ' Lng: ' + lng,
    place_type: ['coordinate'],
    properties: {},
    type: 'Feature'
    };
    }
    
    const coord1 = Number(matches[1]);
    const coord2 = Number(matches[2]);
    const geocodes = [];
    
    if (coord1 < -90 || coord1 > 90) {
    // must be lng, lat
    geocodes.push(coordinateFeature(coord1, coord2));
    }
    
    if (coord2 < -90 || coord2 > 90) {
    // must be lat, lng
    geocodes.push(coordinateFeature(coord2, coord1));
    }
    
    if (geocodes.length === 0) {
    // else could be either lng, lat or lat, lng
    geocodes.push(coordinateFeature(coord1, coord2));
    geocodes.push(coordinateFeature(coord2, coord1));
    }
    
    return geocodes;
    };
    
    // Add the control to the map.
      map.addControl(
      new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: coordinatesGeocoder,
      zoom: 12,
      placeholder: 'Search for places',
      mapboxgl: mapboxgl,
      reverseGeocode: true
      })
    );
}
function routeCallback(route)
{
  console.log(route);
  route_geojson = route;
  if(!map.isSourceLoaded('route'))
  {
    map.addSource('route', {
    'type': 'geojson',
    'data': {
    'type': 'Feature',
    'properties': {},
    'geometry': {
    'type': 'LineString',
    'coordinates': route['routes'][0]['geometry']['coordinates']
    }
    }
    });
    
  }
  else
  {
    map.removeLayer('route');
    map.removeSource('route');
    map.addSource('route', {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': route['routes'][0]['geometry']['coordinates']
        }
      }
    });
  }
  map.addLayer({
  'id': 'route',
  'type': 'line',
  'source': 'route',
  'layout': {
  'line-join': 'round',
  'line-cap': 'round'
  },
  'paint': {
  'line-color': '#5c96f2',
  'line-width': 8
    }
  });
}

function onStartedDownload(id) {
  console.log(`Started downloading: ${id}`);
}

function onFailed(error) {
  console.log(`Download failed: ${error}`);
}

function download_gpx(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));  
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}


function generate_gpx()
{
  
  var gpx_ready = togpx(route_geojson.routes[0]);  
  download_gpx("route.gpx", gpx_ready);
}
function get_coords(order)
{
  let final_route = []


  final_route.push({'lng':midpoints[order[0]]['black']['lng'],'lat':midpoints[order[0]]['black']['lat']});
  final_route.push({'lng':midpoints[order[0]]['red']['lng'],'lat':midpoints[order[0]]['red']['lat']});

  let prev = {'lng':midpoints[order[0]]['red']['lng'],'lat':midpoints[order[0]]['red']['lat']};


  for(let i = 1;i < order.length;i++)
  {
    if(coords_dist(prev,midpoints[order[i]]['black']) < coords_dist(prev,midpoints[order[i]]['red']))
    {
      final_route.push({'lng':midpoints[order[i]]['black']['lng'],'lat':midpoints[order[i]]['black']['lat']});
      final_route.push({'lng':midpoints[order[i]]['red']['lng'],'lat':midpoints[order[i]]['red']['lat']});
      prev = {'lng':midpoints[order[i]]['red']['lng'],'lat':midpoints[order[i]]['red']['lat']};
    }
    else
    {
      final_route.push({'lng':midpoints[order[i]]['red']['lng'],'lat':midpoints[order[i]]['red']['lat']});
      final_route.push({'lng':midpoints[order[i]]['black']['lng'],'lat':midpoints[order[i]]['black']['lat']});
      prev = {'lng':midpoints[order[i]]['black']['lng'],'lat':midpoints[order[i]]['black']['lat']};
    }
    
  }
  return final_route;

}

function getDirections(order)
{

  final_route = get_coords(order);

  const plan_profile = 'walking';
  
  const cost_type = ''; // Null is duration, or distance
  let cost_add = '';

  if(cost_type != '')
  {
    cost_add = ('&annotations=' + cost_type);
  }

  const approach_type = 'curb';
  
  let coords = '';
  final_route.forEach(element => {
    coords += element['lng'] + ',' + element['lat'] + ';';
  });

  coords = coords.slice(0,-1);

  let approach = '';
  for(let i = 0;i < MarkerArray.length;i++)
  {
    approach += (approach_type + ';'); 
  }

  approach = approach.slice(0,-1);

  const url='https://api.mapbox.com/directions/v5/mapbox/' + plan_profile + '/' + coords + 
  '?&overview=full&geometries=geojson&access_token=pk.eyJ1IjoibWVzaWNzbWF0eWkiLCJhIjoiY2swM2pndWttMGE0ZjNtcDU0Yjc1ejF0YiJ9.QTpGLoEnNwVb6lR1xab2NQ';

  fetch(url)
  .then(data=> data.json())
  .then((res) => this.routeCallback(res))
  .catch(error=>{console.log(error)}) 
}


function getMatrixFromResponse(responsJson,cost_type)
{
  let cost_matrix = [];
  let cost_base = 'durations';
  if(cost_type != '')
  {
    cost_base = 'distances';
  }

  for (let matrix_elem in responsJson[cost_base])
  {
    cost_matrix.push([]);
    for (let cost in responsJson[cost_base][matrix_elem])
    {
      cost_matrix[matrix_elem].push(responsJson[cost_base][matrix_elem][cost])
    }
  }
  let vec;
  getDirections(minKoltseg(cost_matrix,cost_matrix,vec));

}
function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}
function radians_to_degress(radians)
{
  var pi = Math.PI;
  return radians * 180/pi;
}
function midPoint(coord1,coord2){

  let dLon = degrees_to_radians(coord2['lng'] - coord1['lng']);

  //convert to radians
  let lat1 = degrees_to_radians(coord1['lat']);
  let lat2 = degrees_to_radians(coord2['lat']);
  let lon1 = degrees_to_radians(coord1['lng']);

  let Bx = Math.cos(lat2) * Math.cos(dLon);
  let By = Math.cos(lat2) * Math.sin(dLon);
  let lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
  let lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

  return {'lng':radians_to_degress(lon3),'lat':radians_to_degress(lat3),'black':coord1,'red':coord2}
}

function segment_distances()
{
  for(let i = 0;i < black_markers.length;i++)
  {
    let min_dist = 100000000;
    let index_loc = null;
    for(let j = 0;j < red_markers.length;j++)
    {
      actual_dist = coords_dist(black_markers[i],red_markers[j]);
      if(actual_dist < min_dist)
      {
        actual_dist = min_dist;
        index_loc = j;
      }
    }
    coord_pairs.push({'black':black_markers[i],'red':red_markers[index_loc]});
    red_markers.splice(index_loc);

  }
  coord_pairs.forEach(element => {
    midpoints.push(midPoint(element['black'],element['red']));
  });
}

function plan_route()
{
  segment_distances();

  const plan_profile = 'walking';
  
  const cost_type = ''; // Null is duration, or distance
  let cost_add = '';

  if(cost_type != '')
  {
    cost_add = ('&annotations=' + cost_type);
  }

  const approach_type = 'curb';
  
  let coords = '';
  midpoints.forEach(marker => {
    coords += (marker['lng'] + ',' + marker['lat'] + ';');
  });

  coords = coords.slice(0,-1);

  let approach = '';
  for(let i = 0;i < midpoints.length;i++)
  {
    approach += (approach_type + ';'); 
  }

  approach = approach.slice(0,-1);

  const url='https://api.mapbox.com/directions-matrix/v1/mapbox/' + plan_profile + '/' + coords + 
  '?approaches=' + approach + cost_add + 
  '&access_token=pk.eyJ1IjoibWVzaWNzbWF0eWkiLCJhIjoiY2swM2pndWttMGE0ZjNtcDU0Yjc1ejF0YiJ9.QTpGLoEnNwVb6lR1xab2NQ';

  fetch(url)
  .then(data=> data.json())
  .then((res) => this.getMatrixFromResponse(res,cost_type))
  .catch(error=>{console.log(error)})
  

}
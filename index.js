let MarkerArray = []

let route_geojson = null;

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
    new mapboxgl.Marker({ color: 'black'})
      .setLngLat([e.lngLat.wrap()['lng'],e.lngLat.wrap()['lat']])
      .addTo(map);
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
  element.setAttribute(encodeURIComponent(text));
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

function getDirections(order)
{
  const plan_profile = 'walking';
  
  const cost_type = ''; // Null is duration, or distance
  let cost_add = '';

  if(cost_type != '')
  {
    cost_add = ('&annotations=' + cost_type);
  }

  const approach_type = 'curb';
  
  let coords = '';
  order.forEach(index => {
    coords += (MarkerArray[index]['lng'] + ',' + MarkerArray[index]['lat'] + ';');
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
  // console.log(cost_matrix);
  getDirections(minKoltseg(cost_matrix,cost_matrix,vec));
  // Call TSP Solver from here !
  // with cost_matrix

}


function plan_route()
{
  const plan_profile = 'walking';
  
  const cost_type = ''; // Null is duration, or distance
  let cost_add = '';

  if(cost_type != '')
  {
    cost_add = ('&annotations=' + cost_type);
  }

  const approach_type = 'curb';
  
  let coords = '';
  MarkerArray.forEach(marker => {
    coords += (marker['lng'] + ',' + marker['lat'] + ';');
  });

  coords = coords.slice(0,-1);

  let approach = '';
  for(let i = 0;i < MarkerArray.length;i++)
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
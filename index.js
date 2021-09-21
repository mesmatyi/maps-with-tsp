function initMap() {
  var options = {
    center: { lat: 47.68501, lng: 16.59049 },
    zoom: 14,
  };

  const myLatlng = { lat: 47.68501, lng: 16.59049 };

  map = new google.maps.Map(document.getElementById("map"), options);

  // Create the initial InfoWindow.
  let infoWindow = new google.maps.InfoWindow({
    content: "Start!",
    position: myLatlng,
  });
  infoWindow.open(map);
  // Configure the click listener.
  map.addListener("click", (mapsMouseEvent) => {
    // Close the current InfoWindow.
    infoWindow.close();
    // Create a new InfoWindow.
    infoWindow = new google.maps.InfoWindow({
      position: mapsMouseEvent.latLng,
    });
    infoWindow.setContent(
      JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2)
    );
    infoWindow.open(map);
  });

  google.maps.event.addListener(map, "click", (event) => {
    //Add marker
    addMarker({ location: event.latLng });
  });

  let MarkerArray = [];

  for (let i = 0; i < MarkerArray.length; i++) {
    addMarker(addMarker[i]);
  }

  function addMarker(property) {
    const marker = new google.maps.Marker({
      position: property.location,
      map: map,
      icon: property.imageIcon,
    });
  }

  //calculate the distance
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
}
//geocode();
//getLocationForm
var locationForm = document.getElementById("location-form");

//Listen for submit
locationForm.addEventListener("submit", geocode);

function geocode(e) {
  //Prevent actual submit
  e.preventDefault();

  var location = document.getElementById("start-input").value;

  axios
    .get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address: location,
        key: "AIzaSyDaomzBPGjAnjdsjUln-S2Di9YFCESsHHo",
      },
    })
    .then(function (response) {
      //Log full response
      console.log(response);

      //Formated Address
      var formattedAddress = response.data.results[0].formatted_address;
      var formattedAddressOutput = `
      <ul class"list-group>
      <li class="list-group-item">${formattedAddress}</li>
      </ul>
      `;
      //Address Componets
      var addressComponents = response.data.results[0].address_components;
      var addressComponentsOutput = '<ul class="list-group">';
      for (var i = 0; i < addressComponents.length; i++) {
        addressComponentsOutput += `
        <li class="list-group-item"><stong>${addressComponents[i].types[0]}</strong>:${addressComponents[i].long_name}</li>
        `;
      }
      addressComponentsOutput += "</ul>";

      //Geometry
      var lat = response.data.results[0].geometry.location.lat;
      var lng = response.data.results[0].geometry.location.lng;
      var geometryOutput = `
      <ul class"list-group>
      <li class="list-group-item"><stong>Latitude</stong>:${lat}</li>
      <li class="list-group-item"><stong>Longitude</stong>:${lng}</li>
      </ul>
      `;

      //Output to app
      document.getElementById(
        "formatted-address"
      ).innerHTML = formattedAddressOutput;
      document.getElementById(
        "address-components"
      ).innerHTML = addressComponentsOutput;
      document.getElementById("geometry").innerHTML = geometryOutput;
    })
    .catch(function (error) {
      console.log(error);
    });
}

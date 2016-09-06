 var googleSuccess = function() {
     function appViewModel() {
         var self = this,
             map,
             service,
             infowindow,

             // Map Markers
             markers = [];

         // Cape Town Coordinates to load map
         CapeTown = new google.maps.LatLng(-33.9248685, 18.4240553),

             // hold search text filled in
             this.searchText = ko.observable('');

         // array to hold info for knockout, selft refering to this 
         self.allPlaces = ko.observableArray([]);

         // computed array with places that match the filter, selft refering to this 
         self.filterPlaces = ko.computed(function() {
             var return_arr = [];

             for (var e = 0; e < markers.length; e++) {
                 markers[e].setVisible(false);
             }
             for (var k = 0, place; k < self.allPlaces().length; k++) {
                 place = self.allPlaces()[k];
                 if (self.searchText() === '' || place.name.toLowerCase().indexOf(self.searchText()) > -1) {
                     // add those places where name contains search text
                     return_arr.push(place);
                     for (var e = 0; e < markers.length; e++) {
                         // makes those markers visible
                         if (place.place_id === markers[e].place_id) {
                             markers[e].setVisible(true);
                         }
                     }
                 }
             }
             return return_arr;
         });

         // variable hold foursquare information
         self.foursquareInfo = '';

         // Finds the center of the map to get lat and lng values
         function computeCenter() {
             var latAndLng = map.getCenter();
             lat = latAndLng.lat();
             lng = latAndLng.lng();
         }

         // Function Loads 
         function initialize() {

             // Map Styling
             var styleArray = [{
                 featureType: "all",
                 stylers: [
                     { hue: "#02b3e4" },
                     { saturation: -80 }
                 ]
             }, {
                 featureType: "road.arterial",
                 elementType: "geometry",
                 stylers: [
                     { hue: "#00ffee" },
                     { saturation: 50 }
                 ]
             }, {
                 featureType: "poi.business",
                 elementType: "labels",
                 stylers: [
                     { visibility: "off" }
                 ]
             }];

             map = new google.maps.Map(document.getElementById('map-canvas'), {
                 // Cape Town coordinates to load the map when the app starts
                 center: CapeTown,
                 // Styles for the map
                 styles: styleArray,
             });

             getPlaces();
             computeCenter();
             // Input field for filtering locations
             var input = (document.getElementById('loc-input'));
             map.controls[google.maps.ControlPosition.LEFT_TOP].push(input);
             // Loaded location list
             var list = (document.getElementById('list'));
             map.controls[google.maps.ControlPosition.LEFT_TOP].push(list);
             var searchBox = new google.maps.places.SearchBox(
                 (input));
             google.maps.event.addListener(searchBox, 'places_changed', function() {
                 var places = searchBox.getPlaces();
                 clearOverlays();
                 self.allPlaces.removeAll();
                 var bounds = new google.maps.LatLngBounds();


                 for (var e = 0, place; e < 10; e++) {
                     if (places[e] !== undefined) {
                         place = places[e];

                         getAllPlaces(place);
                         createMarker(place);
                         bounds.extend(place.geometry.location);
                     }
                 }
                 map.fitBounds(bounds);
                 computeCenter();
             });
             google.maps.event.addListener(map, 'bounds_changed', function() {
                 var bounds = map.getBounds();
                 searchBox.setBounds(bounds);
             });
         }

         // Function to pre-populate the map with place types. 
         //  nearbySearch retuns up to 20 places.        
         function getPlaces() {
             var request = {
                 // Cape Town coordinates  
                 location: CapeTown,
                 // Radius definition to find all locations
                 radius: 100000,
                 //Type of locations to load in the map
                 types: ['university']
             };

             infowindow = new google.maps.InfoWindow();
             service = new google.maps.places.PlacesService(map);
             service.nearbySearch(request, callback);
         }

         // Gets the callback from Google and creates a marker for each place.
         //   Sends info to getAllPlaces.
         function callback(results, status) {
             if (status == google.maps.places.PlacesServiceStatus.OK) {
                 bounds = new google.maps.LatLngBounds();
                 results.forEach(function(place) {
                     place.marker = createMarker(place);
                     bounds.extend(new google.maps.LatLng(
                         place.geometry.location.lat(),
                         place.geometry.location.lng()));
                 });
                 map.fitBounds(bounds);
                 results.forEach(getAllPlaces);
             } else {
                 // Error message when API 
                 alert('Places API request fails');
             }
         }

         // Function to create a marker at each place.  
         // This is called on load of the map with the pre-populated list, and also after each search.
         //   Also sets the content of each place's infowindow.
         function createMarker(place) {
             var marker = new google.maps.Marker({
                 map: map,
                 zoom: 5,
                 icon: 'js/mapmarker/MapMarkerIcon.svg', //Custom svg image for Map Marker
                 name: place.name.toLowerCase(),
                 position: place.geometry.location,
                 place_id: place.place_id,
                 animation: google.maps.Animation.DROP
             });
             var address;
             if (place.formatted_address !== undefined) {
                 address = '<b>Address:</b>' + place.formatted_address;
             } else if (place.vicinity !== undefined) {
                 address = '<b>Vicinity:</b>' + place.vicinity;
             }
             var contentString = '<div class="content"><div style="font-weight: bold">' + place.name + '</div><div>' + address + '</div></div>' + self.foursquareInfo;

             google.maps.event.addListener(marker, 'click', function(e) {
                 e.preventDefault;
                 infowindow.setContent(contentString);
                 infowindow.open(map, this);
                 map.panTo(marker.position);
                 marker.setAnimation(google.maps.Animation.BOUNCE);
                 setTimeout(function() {
                     marker.setAnimation(null);

                 }, 500);
             });

             markers.push(marker);
             return marker;
         }

         this.getFoursquareInfo = function(point) {
             // creats our foursquare URL
             var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id=VGW53IWWPVNRZBDUNHFW1Z2GQZBHFYIDWOTNA5M2S2AIXFVL&client_secret=URVFRTKS0AWCICYJBGEPFWUHYAU3CTB0SPKCBCVHDB3FG4LL&v=20150321' + '&ll=' + lat + ',' + lng + '&query=\'' + point.name + '\'&limit=1';
             return $.getJSON(foursquareURL)
                 .done(function(response) {
                     self.foursquareInfo = '<p><span style="font-size:16px; font-weight: bold">Details:</span><br>';

                     var venue = response.response.venues[0];

                     if (venue) {
                         // Location Name       
                         var venueName = venue.name;

                         if (venueName !== null && venueName !== undefined) {
                             self.foursquareInfo += 'Name: ' + venueName + '<br>';
                         }
                     } else {
                         self.foursquareInfo += 'No Foursquare Data available';
                     }
                 })
                 // Foursquare API Error message
                 .fail(function(error) {
                     alert("Foursquare API has failed, error details:" + error);
                 });
         };

         // Function that will pan to the position and open an info window of an item clicked in the list.        
         self.clickMarker = function(place) {
             var marker;

             for (var e = 0; e < markers.length; e++) {
                 if (place.place_id === markers[e].place_id) {
                     marker = markers[e];
                     break;
                 }
             }
             self.getFoursquareInfo(place).then(function() {
                 var contentString = '<div class="content"><div style="font-weight: bold">' + place.name + '</div><div>' + place.address + '</div>' + '<div>' + self.foursquareInfo + '</div>';
                 infowindow.setContent(contentString);
                 infowindow.open(map, marker);
                 marker.setAnimation(google.maps.Animation.DROP);
             });
             map.panTo(marker.position);
         };

         // function that gets the information from all the places that we are going to search and also pre-populate.  
         // Pushes this info to the allPlaces array for knockout.
         function getAllPlaces(place) {
             var placeit = {};
             placeit.place_id = place.place_id;
             placeit.position = place.geometry.location.toString();
             placeit.name = place.name;

             var address;
             if (place.vicinity !== undefined) {
                 address = place.vicinity;
             } else if (place.formatted_address !== undefined) {
                 address = place.formatted_address;
             }
             placeit.address = address;

             self.allPlaces.push(placeit);
         }

         //an observable that retrieves its value when first bound
         ko.onDemandObservable = function(callback, target) {
             var _value = ko.observable(); //private observable

             var result = ko.computed({
                 read: function() {
                     //if it has not been loaded, execute the supplied function
                     if (!result.loaded()) {
                         callback.call(target);
                     }
                     //always return the current value
                     return _value();
                 },
                 write: function(newValue) {
                     //indicate that the value is now loaded and set it
                     result.loaded(true);
                     _value(newValue);
                 },
                 // deferEvaluation: true 
                 // //do not evaluate immediately when created
             });

             //expose the current state, which can be bound against
             result.loaded = ko.observable();
             //load it again
             result.refresh = function() {
                 result.loaded(false);
             };

             return result;
         };

         // loading gif 
         $('.loading').hide();

         // called after a search, this function clears any markers in the markers so that we can start with fresh map with new markers.
         function clearOverlays() {
             for (var i = 0; i < markers.length; i++) {
                 markers[i].setMap(null);
             }
             markers.length = 0;
         }


         google.maps.event.addDomListener(window, 'load', initialize);
     }

     $(function() {
         ko.applyBindings(new appViewModel());
     });
 }

 // Make List draggable
 $(function() {
     $("#list").draggable();
 });

 // Google Map Error
 function googleError() {
     alert("Google Maps did not load");
 }

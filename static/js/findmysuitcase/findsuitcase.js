
var map;
var cicle;
var username = "";

function updatePosition() {

	var coordinates = [48.23617222222222, 11.067086111111111];
	if(cicle) { 
		cicle.remove();
		cicle = null;
	}
	map.setView(coordinates, 18);

	
	circle = L.circle(coordinates, {
	    color: 'red',
	    fillColor: '#f03',
	    fillOpacity: 0.3,
	    opacity: 0.8,
	    radius: .45 * 75
	}).addTo(map);

}

$(document).ready(function() {

	if(window.localStorage.getItem('username')) {
		username = window.localStorage.getItem('username');
		console.log(username);
		 $("#inp-username").val(username);
	}	

	map = L.map('map').setView([51.505, -0.09], 13);

	var tiles = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHNlaW1hbiIsImEiOiJjbDM0bHhsYnMxNTN6M2pwOW8zbXE2aDc4In0.329-O1ilT8KjDVDJO-phFA', {
			maxZoom: 25,
			id: 'mapbox/streets-v11',
			tileSize: 512,
			zoomOffset: -1
	}).addTo(map);

	$('#btn-refresh').click((e) => {
		updatePosition();
	});

	$('#inp-username').on("input", function(){
		username =  $("#inp-username").val();

		window.localStorage.setItem('username', username);
	});
/*
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);
*/

});
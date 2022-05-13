var map;
var cicle;
var username = "";



function setMarkerAndMap(coordinates,hepe) {

        if(!coordinates || !coordinates[0] || !coordinates[1] || !hepe) {
            console.warn("cant set marker coordinates or hepe not OK:", coordinates, hepe);
            return;
        }
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
            radius: hepe * 75
        }).addTo(map);
}

function setMarkerText(data) {
    $('#text-pos').html(data.lat + ",&nbsp;&nbsp;" + data.lon);
    $('#text-altitude').html(data.Altitude + "m");
    $('#text-lastupdate').html(data.time.value);
}

function updatePosition() {
        if(typeof username === 'undefined' || !username || username ==='') {
            alert("username must be set");
            return;
        }

        let location = (new URL(window.location));
        let domain = location.host.match(/^[-_a-zA-Z0-9]*(\.[-_\.a-zA-Z0-9]*)(:.*)?$/i)[1];
        let apiURL = `${location.protocol}//suitcase-api${domain}/suitcase`;

        $.getJSON( apiURL , {'id': username} ).done(function( json ) {
//    console.log( "Answer: ", json );
            setMarkerAndMap([json.lat,json.lon],json.HEPE);
            setMarkerText(json);
        }).fail(function( jqxhr, textStatus, error ) {
            console.error( "Request Failed: " + error );
            setmarkerAndMap([48.23617222222222, 11.067086111111111],0.49);

        });


}

$(document).ready(function() {


        if(window.localStorage.getItem('username')) {
                username = window.localStorage.getItem('username');
        //      console.log(username);
                 $("#inp-username").val(username);
        }
        if(typeof username !== 'undefined' && username && username !== '') updatePosition();

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

});
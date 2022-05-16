'use strict';

var user = {};

var flightdata = {
        'ABC123'        : {flightno: 'ABC123'   , origin: 'Munich', destination: 'Toronto'      , destShort: 'YYZ', timest: 1652515800, info1: '43.6766°N, 79.6305°W'   , info2: '569FT,   UTC -05:00HR'},
        'ABC3455'       : {flightno: 'ABC3455'  , origin: 'Munich', destination: 'Milan'        , destShort: 'MXP', timest: 1652692320, info1: '45.63°N, 8.7230°E'              , info2: '1,000FT, UTC +02:00HR'},
        'ABC1234'       : {flightno: 'ABC1234'  , origin: 'Munich', destination: 'New York'     , destShort: 'JFK', timest: 1652897520, info1: '40.6397°N, 73.7788°W'   , info2: '13FT,    UTC -05:00HR'},
        'ABC7893'       : {flightno: 'ABC7893'  , origin: 'Munich', destination: 'Berlin'       , destShort: 'BER', timest: 1655215860, info1: '52.3666°N, 13.5033°E'   , info2: '157FT,   UTC +02:00HR'},
        'ABC234'        : {flightno: 'ABC234'   , origin: 'Munich', destination: 'Paris'        , destShort: 'CDG', timest: 1655918460, info1: '49.0097°N, 2.5477°E'    , info2: '392FT,   UTC +02:00HR'},
        'ABC756'        : {flightno: 'ABC756'   , origin: 'Munich', destination: 'London'       , destShort: 'LHR', timest: 1656087120, info1: '51.4775°N, 0.4613°W'    , info2: '83FT,    UTC +01:00HR'}
};






$(document).ready(function() {
        let locationURL = (new URL(window.location));
        let domain = locationURL.host.match(/^[-_a-zA-Z0-9]*(\.[-_\.a-zA-Z0-9]*)(:.*)?$/i)[1];
        let apiURL = `${location.protocol}//suitcase-api${domain}/bookflight`;


        for (const [key, value] of Object.entries(flightdata)) {
                var d = new Date(0);
                d.setUTCSeconds(value.timest)

                $('#flight-data').append(`
            <div class="col-md-16 col-md-offset-0 flight-selectable" data-name="${value.flightno}">
                <span class="timetable-1"><i class="fa fa-plane"></i>${value.origin}</span>
                <span class="timetable-2"><i class="fa fa-arrow-right"></i>${value.destination}</span>
                <span class="timetable-3">|</span>
                <span class="timetable-4">${value.flightno}</span>
                <span class="timetable-5"><i class="fa fa-clock-o"></i>${moment(d).format('MM/DD/YYYY')}</span>
                <span class="timetable-6">${moment(d).format('HH:mm')}</span>
            </div>
                `);

        }
        if(window.localStorage.getItem('user')) {
            user = JSON.parse(window.localStorage.getItem('user'));
                if(user.name) $('#inputUsername').val(user.name);
            //    if(user.token)   $('#inputToken').val(user.token);
    	}
    
    	if((!user) || (!user.name) ) $('#modal-login').modal('show');

        // window.localStorage.setItem('username', username);

        $('#btn-user').click((e) => {
                $('#modal-login').modal('show');
                if(user.name) $('#inputUsername').val(user.name);
        if(user.token)   $('#inputToken').val(user.token);
        });

        $('#btn-save-token').click((e) => {
                user.name = $('#inputUsername').val();
//                user.token = $('#inputToken').val();
                window.localStorage.setItem('user',JSON.stringify(user));
                $('#modal-login').modal('hide');
        });

        $('.flight-selectable').on('click', function() {
                $('.flight-selectable').each(function() {
                        $(this).removeAttr('selected');
                        $(this).removeClass('flight-selected');
                });
                var dataToSend = flightdata[$(this).attr('data-name')];
                if(!dataToSend) {
                        throw("no data to be send but button clicked");
                }
                dataToSend.username = user.name;
                var that = this;
                var fakeSet = setTimeout( function() {
                    console.warn("was faster than cloud");
                    $(that).attr('selected', true);
                    $(that).addClass('flight-selected');
                },10000);
                console.log("the selected flight is:", dataToSend);
                $.ajax({
                    url: apiURL,
                    type: "POST",
                    data: JSON.stringify(dataToSend),
                    success: function(e){
                        console.log("Send outcome: " +  JSON.stringify(e));
                        clearTimeout(fakeSet);
                        $(that).attr('selected', true);
                        $(that).addClass('flight-selected');
                    },
                    dataType: 'json',
                    contentType : 'application/json',
                    processData: false
                });

        });

        $('#btn-showhide-pw').click(function () {
                if($('#inputToken').attr('type') === 'password') {
                        $('#inputToken').attr('type','text');
                        $('#btn-showhide-pw > i').removeClass('fa-eye').addClass('fa-lock');
                } else {
                        $('#inputToken').attr('type','password');
                        $('#btn-showhide-pw > i').removeClass('fa-lock').addClass('fa-eye');
                }
        });

});
(END)
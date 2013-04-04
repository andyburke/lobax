var http = require( 'http' );
var async = require( 'async' );

var timeout = 0;

var startTime = +new Date();
var served = 0;

function SendRequest() {
    var request = http.request({
        host: 'localhost',
        port: process.env[ 'LOBAX_HTTP_PROXY_PORT' ] || 8001,
        path: '/'
    }, function( response ) {
        
        response.setEncoding( 'utf8' );
        response.on( 'data', function( chunk ) {
        });
        
        response.on( 'end', function() {
            ++served;
            setTimeout( SendRequest, timeout );
        });
    });
    
    request.on( 'error', function( error ) {
        console.log( error );
        process.exit( 1 );
    });
    
    request.end();
}

function ShowRate() {
    var curTime = +new Date();
    var rate = ( served / ( curTime - startTime ) ) * 1000;
    console.log( Math.round( rate ) + ' / sec' );
    setTimeout( ShowRate, 10000 );
}

SendRequest();
ShowRate();
var http = require( 'http' );
var async = require( 'async' );

var timeout = 33;

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
            setTimeout( SendRequest, timeout );
        });
    });
    
    request.on( 'error', function( error ) {
        console.log( error );
        process.exit( 1 );
    });
    
    request.end();
}

SendRequest();
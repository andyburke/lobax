var http = require( 'http' );
var async = require( 'async' );

var NUM_SERVERS = 10;
var BASE_PORT = 9000;

var servers = [];
for ( var i = 0; i < NUM_SERVERS; ++i )
{
    (function() {
        var id = i;
        servers.push( http.createServer( function( request, response ) {
            response.writeHead( 200, {'Content-Type': 'text/plain'} );
            response.end( 'Hello World\n' );
        }).listen( BASE_PORT + id ));
    })();
}

var api = null;

var apiRequest = http.request({
        host: 'localhost',
        port: process.env[ 'LOBAX_HTTP_PORT' ] || 8000,
        path: '/api/1.0'
    }, function( response ) {
        var result = '';
        
        response.setEncoding( 'utf8' );
        response.on( 'data', function( chunk ) {
            result += chunk;
        });
        
        response.on( 'end', function() {
            api = JSON.parse( result );
            SendHeartbeats();
        });
    });

apiRequest.on( 'error', function( error ) {
    console.log( error );
    process.exit( 1 );
});

apiRequest.end();


function SendHeartbeats() {
    
    var i = -1;
    async.each( servers, function( server, callback ) {
        var heartbeatData = {
            id: ++i,
            host: 'localhost',
            port: BASE_PORT + i,
            timeout: 1000,
            priority: 0
        };
        
        var json = JSON.stringify( heartbeatData );

        var heartbeatUrl = api.target.heartbeat.replace( '{{id}}', i );

        var heartbeatRequest = http.request({
            host: 'localhost',
            port: process.env[ 'LOBAX_HTTP_PORT' ] || 8000,
            path: heartbeatUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': json.length
            }
        }, function( heartbeatResponse ) {
            heartbeatResponse.setEncoding( 'utf8' );
            
            heartbeatResponse.on( 'data', function( chunk ) {
            });
            
            heartbeatResponse.on( 'end', function() {
                callback();
            });
        });

        heartbeatRequest.on( 'error', function( error ) {
            callback( error ); 
        });
        
        heartbeatRequest.write( json );
        heartbeatRequest.end();

    }, function( error ) {
        if ( error )
        {
            console.log( error );
            process.exit( 1 );
        }

        setTimeout( SendHeartbeats, 300 );
    });
}

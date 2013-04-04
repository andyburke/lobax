var http = require( 'http' );
var https = require( 'https' );
var httpProxy = require( 'http-proxy' );
var faye = require( 'faye' );
var uuid = require( 'node-uuid' );

var fs = require( 'fs' );
var extend = require( 'node.extend' );

var proxy = new httpProxy.RoutingProxy();

var handlers = require( './lib/handlers' );

var config = {
    port: process.env[ 'LOBAX_HTTP_PROXY_PORT' ] || 8001,
    ssl: {
        port: process.env[ 'LOBAX_HTTPS_PROXY_PORT' ] || 8443
    }
};

var configFile = process.env[ 'LOBAX_CONFIG' ] || 'config.json';

if ( fs.existsSync( configFile ) )
{
    var fromConfigFile = require( configFile );
    config = extend( config, fromConfigFile );
}

var httpProxyServer = null;
var httpsProxyServer = null;

if ( config.ssl.key )
{
	var sslOptions = {
        https: {
            key: fs.readFileSync( config.ssl.key ),
            cert: fs.readFileSync( config.ssl.cert )
        },
        enable: {
            xforward: true
        }
	};

	httpsProxyServer = httpProxy.createServer( sslOptions, function( request, response ) {
		handlers.Request( request, response, httpsProxyServer, GetBestServer() );
	}).listen( config.ssl.port, config.ssl.host );

    httpsProxyServer.on( 'upgrade', function( request, socket, head ) {
        handlers.WebsocketRequest( request, socket, head, httpsProxyServer, GetBestServer() );
    });

}

httpProxyServer = httpProxy.createServer({
    enable: {
        xforward: true
    }
}, function( request, response, proxy ) {
    handlers.Request( request, response, httpProxyServer, GetBestServer() );
}).listen( config.port, config.host );

httpProxyServer.on( 'upgrade', function( request, socket, head ) {
    handlers.WebsocketRequest( request, socket, head, httpProxyServer, GetBestServer() );
});

var Priorities = require( './lib/priorities' );
var targets = new Priorities({
    sort: 'low',
    useNativePriority: true
});

var offlinePriority = 9999999999;
function GetBestServer() {
    var possible = targets.size();
    var result = null;
    var tried = 0;
    while( ( result == null ) && ( tried < possible ) )
    {
        possible = targets.size(); // it's possible for this to be modified elsewhere, so reset it
        var serverEntry = targets.shiftEntry();

        if ( serverEntry.object.online )
        {
            result = extend( serverEntry.object, {} );
            serverEntry.object.priority += 100;
        }
        else
        {
            serverEntry.object.priority = offlinePriority;
        }

        ++tried;        
        targets.push( serverEntry.object );
    }
    
    return result;
}

var express = require('express');
var app = express();
app.use( express.bodyParser() );
app.use( express.static(  __dirname + '/ui' ) );

var RecursiveRequire = require( './lib/recursiverequire' );
var requires = RecursiveRequire.require( './api' );

var subsystems = [];

var options = {
    app: app,
    targets: targets,
    subsystems: subsystems
};

for ( var req in requires )
{
    var system = requires[ req ];
    subsystems.push( new ( system )( options ) );
}

var httpServer = null;
var httpsServer = null;

var bayeux = new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
});

function SetupIO( server ) {
    bayeux.attach( server );
}

if ( config.ssl.key )
{
    httpsServer = https.createServer({
        key: fs.readFileSync( config.ssl.key ),
        cert: fs.readFileSync( config.ssl.cert )
    }, app );
    SetupIO( httpsServer );
    httpServer.listen( process.env[ 'LOBAX_HTTP_PORT' ] || 4443 );
}

httpServer = http.createServer( app );
SetupIO( httpServer );
httpServer.listen( process.env[ 'LOBAX_HTTP_PORT' ] || 8000 );

function EmitTargets() {
    bayeux.getClient().publish( '/lobax', {
        id: uuid.v4(),
        kind: 'targets',
        targets: targets.map( function( entry ) {
            return entry.object;
        })
    });         
    
    setTimeout( EmitTargets, 3000 );
}
EmitTargets();
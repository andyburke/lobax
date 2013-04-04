var Request = module.exports.Request = function( request, response, proxyServer, server ) {
    if ( !server )
    {
        response.statusCode = 502;
        response.end();
        return;
    }

    proxyServer.proxy.proxyRequest( request, response, {
        host: server.host,
        port: server.port
    });
    server.requests++;
}

var WebsocketRequest = module.exports.WebsocketRequest = function( request, socket, head, proxyServer, server ) {
    if ( !server )
    {
        response.statusCode = 502;
        response.end();
        return;
    }

    proxyServer.proxy.proxyWebSocketRequest( request, socket, head, {
        host: server.host,
        port: server.port
    });
    server.websocketRequests++;
}
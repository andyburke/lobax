var extend = require( 'node.extend' );

var timeouts = {};

var TargetManagement = module.exports = function( options ) {
    var self = this;

    options.app.post( '/api/1.0/Target/:id/Heartbeat', function( request, response ) {
        var target = null;
        
        var entry = options.targets.findEntry( 'id', request.param( 'id' ) );
        if ( !entry )
        {
            target = {
                id: request.param( 'id' ),
                created: +new Date(),
                timeout: request.body.timeout,
                host: request.body.host,
                port: request.body.port,
                online: true,
                priority: request.body.priority || 0,
                requests: 0,
                websocketRequests: 0
            };
            entry = options.targets.push( target );
        }
        else
        {
            target = entry.object = extend( entry.object, {
                updated: +new Date(),
                online: true,
                priority: request.body.priority || 0
            });
            options.targets.touch( entry );
        }
        
        if ( target.timeout )
        {
            if ( timeouts[ target.id ] )
            {
                clearTimeout( timeouts[ target.id ] );
                delete timeouts[ target.id ];
            }
            
            // capture entry for later timeout callback
            (function() {
                var capturedTarget = target;
                var capturedEntry = entry;
                timeouts[ capturedTarget.id ] = setTimeout( function() {
                    capturedEntry.object.online = false;
                    options.targets.touch( capturedEntry );
                }, capturedTarget.timeout );
            })();
        }

        response.json( target );
    });

    options.app.get( '/api/1.0/Target', function( request, response ) {
        // return targets matching search criteria
        var criteria = {};
        
        if ( request.param( 'id' ) )
        {
           criteria[ 'id' ] = request.param( 'id' );
        }
        
        if ( request.param( 'host' ) )
        {
            var host = request.param( 'host' );
            if ( host.length > 0 )
            {
                if ( host[ 0 ] === '/' )
                {
                    criteria[ 'host' ] = new RegExp( host );
                }
                else
                {
                    criteria[ 'host' ] = new RegExp( '/^' + host + '$/' );
                }
            }
        }
        
        if ( request.param( 'port' ) )
        {
            criteria[ 'port' ] = request.param( 'port' );
        }
        
        var results = [];
        options.targets.map( function( entry ) {
            var matched = true;

            if ( criteria[ 'id' ] && ( entry.object.id !== criteria[ 'id' ] ) )
            {
                matched = false;
            }
            
            if ( criteria[ 'host' ] && !entry.object.host.test( criteria[ 'host' ] ) )
            {
                matched = false;
            }
            
            if ( criteria[ 'port' ] && ( entry.object.port !== criteria[ 'port' ] ) )
            {
                matched = false;
            }
            
            if ( matched )
            {
                results.push( entry.object );
            }
        });

        response.json( results );
    });

    options.app.get( '/api/1.0/Target/:id', function( request, response ) {
        var target = options.targets.find( 'id', request.param( 'id' ) );
        if ( !target )
        {
            response.json( { error: 'invalid target id', message: 'No target exists with id: ' + request.param( 'id' ) }, 404 );
            return;            
        }

        response.json( target );
    });

    options.app.del( '/api/1.0/Target/:id', function( request, response ) {
        var entry = options.targets.findEntry( 'id', request.param( 'id' ) );
        if ( !entry )
        {
            response.json( { error: 'invalid target id', message: 'No target exists with id: ' + request.param( 'id' ) }, 404 );
            return;
        }

        options.targets.removeEntry( entry );
        response.json( true );
    });

    return self;
}

TargetManagement.prototype.Interface = {
    target: {
        base: '/api/1.0/Target',
        self: '/api/1.0/Target/{{id}}',
        heartbeat: '/api/1.0/Target/{{id}}/Heartbeat'
    }
};
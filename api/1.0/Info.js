var extend = require( 'node.extend' );

var Info = module.exports = function( options ) {
    var self = this;
    
    options.app.get( '/api/1.0', function( request, response ) {
        var result = {};

        for ( var i = 0; i < options.subsystems.length; ++i )
        {
            var subsystem = options.subsystems[ i ];
            if ( subsystem.Interface )
            {
                result = extend( result, subsystem.Interface );
            }
        }

        response.json( result );
    });

    return self;
}


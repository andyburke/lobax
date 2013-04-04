
var Priorities = module.exports = function( opts ) {
    this._entries = [];
    this._sorted = false;
    this._useNativePriority = !!opts[ 'useNativePriority' ];
    
    this._sorter = this.sorters.high;
    if ( opts && typeof( opts[ 'sort' ] ) === 'function' )
    {
        this._sorter = opts[ 'sort' ];
    }
    else if ( opts && typeof( opts[ 'sort' ] === 'string' ) )
    {
        this._sorter = this.sorters[ opts[ 'sort' ] ];
        if ( !this._sorter )
        {
            throw 'Unknown sorter: ' + opts[ 'sort' ];
        }
    }
    
    return this;
}

// high and low seem backwards here, but it's because we
// pop off the end of the array
Priorities.prototype.sorters = {
    high: function( a, b ) {
        return a.priority - b.priority;
    },
    low: function( a, b ) {
        return b.priority - a.priority;
    }
}

Priorities.prototype._sort = function() {
    this._entries.sort( this._sorter );
    this._sorted = true;
}

Priorities.prototype.push = function( object, priority ) {
    var entry = {
        object: object,
        priority: this._useNativePriority ? object.priority : priority
    };
    
    this._entries.push( entry );
    this._sorted = false;
    return entry;
}

Priorities.prototype.popEntry = function() {
    if ( !this._sorted )
    {
        this._sort();
    }
    
    return this._entries.pop();
}

Priorities.prototype.pop = function() {
    var entry = this.popEntry();
    return entry ? entry.object : undefined;
}

Priorities.prototype.topEntry = function() {
    if ( !this._sorted )
    {
        this._sort();
    }
    
    return this._entries.length ? this._entries[ this._entries.length - 1 ] : undefined;
}

Priorities.prototype.top = function() {
    var entry = this.topEntry();
    return entry ? entry.object : undefined;
}

Priorities.prototype.get = function( object ) {
    for ( var i = this._entries.length - 1; i >= 0; --i )
    {
        if( this._entries[ i ].object === object )
        {
            return this._entries[ i ];
        }
    }

    return null;
}

Priorities.prototype.getEquivalent = function( object ) {
    for ( var i = this._entries.length - 1; i >= 0; --i )
    {
        if( equivalent( this._entries[ i ].object, object ) )
        {
            return this._entries[ i ];
        }
    }

    return null;
}

Priorities.prototype.findEntry = function( field, value ) {
    var fields = field.split( '.' );
    
    for ( var i = this._entries.length - 1; i >= 0; --i )
    {
        var entry = this._entries[ i ];
        var element = entry.object;
        
        for( var fieldIndex = 0; fieldIndex < fields.length; ++fieldIndex )
        {
            element = element[ fields[ fieldIndex ] ];
            if ( element === undefined )
            {
                break;
            }
        }
        
        if ( element !== undefined && element === value )
        {
            return entry;
        }
    }

    return null;
}

Priorities.prototype.find = function( field, value ) {
    var entry = this.findEntry( field, value );
    return entry ? entry.object : undefined;
}

Priorities.prototype.map = function( callback ) {
    return this._entries.map( callback );
}

Priorities.prototype.filter = function( callback ) {
    return this._entries.filter( callback );
}

Priorities.prototype.contains = function( object ) {
    return !!this.get( object );
}

Priorities.prototype.containsEquivalent = function( object ) {
    return !!this.getEquivalent( object );
}

Priorities.prototype.update = function( object, priority ) {
    var entry = this.get( object );
    if ( entry )
    {
        entry.priority = priority;
        this._sorted = false;
        return true;
    }

    return false;
}

Priorities.prototype.updateEquivalent = function( object, priority ) {
    var entry = this.getEquivalent( object );
    if ( entry )
    {
        entry.priority = priority;
        this._sorted = false;
        return true;
    }

    return false;
}

Priorities.prototype.touch = function( entry ) {
    entry.priority = this._useNativePriority ? entry.object.priority : entry.priority;
    this._sorted = false;
}

Priorities.prototype.remove = function( object ) {
    for ( var i = this._entries.length - 1; i >= 0; --i )
    {
        if( this._entries[ i ].object === object )
        {
            return this._entries.splice( i, 1 );
        }
    }

    return null;
}

Priorities.prototype.removeEquivalent = function( object ) {
    for ( var i = this._entries.length - 1; i >= 0; --i )
    {
        if( equivalent( this._entries[ i ].object, object ) )
        {
            return this._entries.splice( i, 1 );
        }
    }

    return null;
}

Priorities.prototype.removeEntry = function( entry ) {
    for ( var i = this._entries.length - 1; i >= 0; --i )
    {
        if( this._entries[ i ] === entry )
        {
            return this._entries.splice( i, 1 );
        }
    }

    return null;
}

Priorities.prototype.size = function() {
    return this._entries.length;
}

Priorities.prototype.empty = function() {
    return this._entries.length === 0;
}

//http://stackoverflow.com/questions/1068834/object-comparison-in-javascript/1144249#1144249
var equivalent = function( x, y ) {
  var p;
  for(p in x) {
      if(typeof(y[p])=='undefined') {return false;}
  }

  for(p in x) {
      if (x[p]) {
          switch(typeof(x[p])) {
              case 'object':
                  if (!equivalent( x[p], y[p])) { return false; } break;
              case 'function':
                  if (typeof(y[p])=='undefined' ||
                      (p != 'equals' && x[p].toString() != y[p].toString()))
                      return false;
                  break;
              default:
                  if (x[p] != y[p]) { return false; }
          }
      } else {
          if (y[p])
              return false;
      }
  }

  for(p in y) {
      if(typeof(x[p])=='undefined') {return false;}
  }

  return true;    
}

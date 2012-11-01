var mustComb = (function( exports ){

    exports = {};

    exports.tags = ['{{','}}'];

	exports.cache = {};

    exports._Mustache = Mustache;

    exports.setMustache = function( m ){
        exports._Mustache = m;
    };
    
    exports.render = function( template, view, partials ){

    	var extraMap = exports.viewExtraMap[ template ];
    	if ( typeof extraMap == 'object' ) {
    		for ( var key in extraMap ) {
    			eval( 'view["'+ key +'"]='+ extraMap[ key ]);
    		}
    	}
        
    	return this._Mustache.render( template, view, partials );
    };

    return exports;

})( );
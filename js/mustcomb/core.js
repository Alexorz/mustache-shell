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

        // Extra Funcs
        if ( typeof view == 'object' ) {
            view._isFirst_ = view._isFirst_ || function(){
                return this._index_ == 0;
            };

            view._isLast_ = view._isLast_ || function(){
                return this._nIndex_ == this._length_;
            };
        }
        
    	return this._Mustache.render( this.parseComments( template ), view, partials );
    };

    exports.parseComments = function( tmpl ){
        return typeof tmpl != 'string' ? tmpl : tmpl.replace(/<!--\s*#\s*Mustache-IGNORE\s*-->([\s\S]*?)<!--\s*\/\s*Mustache-IGNORE\s*-->/gm,'<!-- # Mustache-IGNORE {{=<% %>=}} -->$1<!-- / Mustache-IGNORE <%={{ }}=%> -->')
                                                    .replace(/\/\*\s*#\s*Mustache-IGNORE\s*\*\/([\s\S]*?)\/\*\s*\/\s*Mustache-IGNORE\s*\*\//gm,'/* # Mustache-IGNORE {{=<% %>=}} */$1/* / Mustache-IGNORE <%={{ }}=%> */');
    };

    return exports;

})( );
var mustComb = (function( exports ){

    exports = {};

    exports.tags = ['{{','}}'];

    exports._Mustache = Mustache;

    exports.setMustache = function( m ){
        exports._Mustache = m;
    };
    
    return exports;

})( );
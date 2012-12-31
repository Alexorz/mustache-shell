var treeNode = (function( ){

    var typeOf = function ( elem ) {
        return jQuery.type(elem);
    }

    var cloneType = {
        'object' : function(obj, parent){

            var copy = new obj.constructor();

            if ( copy._structed ) {
                copy.registNode( );
            }

            for (var key in obj) {
                if ( obj.hasOwnProperty( key ) ) {
                    if ( !( copy._structed && 'id|parentId'.indexOf(key) != -1) ) {
                        copy[key] = clone(obj[key]);
                    }
                }
            }

            if ( copy._structed ) {
                copy.children().map(function( node ){
                    node.parentId = copy.id;
                });
            }
            
            return copy;
        },
        'array' : function(arr) {
            var i=arr.length;
            var copy = new Array(i);
            while (i--) {
                copy[i] = clone(arr[i]);
            }
            return copy;
        },
        'other' : function(variable){
            return variable;
        }
    };

    var clone = function(any, parent, undefined){
        return any && (any.nodeType != undefined?cloneType['other']:(cloneType[$.type(any)] || cloneType['other'])).apply(this, arguments );
    };

    var treeNode = function( value ){
        if ( value && value._structed ) {
            return value;
        }

        this.id       = null;
        this.parentId = null;
        this.key      = null;
        this.type     = typeOf(value);
        this.meta     = {};
        this.value    = {
            'array'  : [],
            'object' : {}
        }[ this.type ] || value;

        this.registNode( );

        if ( this.type == 'object' ) {
            for ( var k in value ) {
                this.append( new this.constructor( value[k] ), k );
            }
        }
        else if ( this.type == 'array' ) {
            for(var i=0,l=value.length;i<l;i++) {
                this.append( new this.constructor( value[i] ) );
            }
        }

        return this;
    };

    treeNode.prototype._structed = true;

    treeNode.prototype.idMap = { currId : 0 };

    treeNode.prototype.constructor = treeNode;

    treeNode.prototype.isLeaf = function(){
        return 'object|array'.indexOf(this.type) == -1;
    };

    treeNode.prototype.clone = function(){
        return clone( this );
    };

    treeNode.prototype.geneNodeId = function(){
        return ++this.idMap.currId;
    };

    treeNode.prototype.registNode = function( ){
        this.id = this.geneNodeId();
        this.idMap[ this.id ] = this;
    };  

    treeNode.prototype.parent = function( filterFn ){
        var parent = this.idMap[ this.parentId ];

        if ( typeOf( filterFn ) == 'function' ) {

            while ( parent != null ) {
                if ( filterFn.call( parent ) ) {
                    return parent;
                }
                else {
                    parent = parent.parent();
                }
            }
        }

        return parent || null;
    };

    treeNode.prototype.children = function( filterFn ){

        var children = [];
        var sub = this.value;

        if ( this.type == 'object' ) {
            for (var k in sub) {
                if ( typeOf( filterFn ) == 'function' ) {
                    if ( filterFn.call( sub[k] ) ) {
                        children.push( sub[k] );
                    }
                }
                else {
                    children.push( sub[k] );
                }
            }
        }
        else if ( this.type == 'array' ) {
            if ( typeOf( filterFn ) == 'function' ) {
                for (var i = 0; i < sub.length; i++) {
                    if ( filterFn.call( sub[i] ) ) {
                        children.push( sub[i] );
                    }
                };
            }
            else {
                children = sub; 
            }
        }

        return children;
    };


    treeNode.prototype.child = function( key ){
        return this.value[ key ] || null;
    };


    treeNode.prototype.delete = function(){
        this.bfTraversal(function(){
            delete this.parent().value[this.key];
            this.parent().reIndexArray();
            delete this.idMap[this.id];
        });
    };  

    treeNode.prototype.reIndexArray = function( ){
        if ( this.type == 'array' ) {
            var subs = this.value;
            for(var i=0,l=subs.length;i<l;i++) {
                var sub = subs[i];
                if ( !sub || sub._structed !== true ) {
                    subs.splice(i, 1);
                    i--;
                    l--;
                }
                else {
                    sub.key = i;
                }
            }
        }
    };  

    treeNode.prototype.append = function ( node, key ){

        node = node._structed ? node : new this.constructor(node);

        var staleParent = node.parent();
        var staleKey = node.key;

        if ( this.type == 'object' ) {
            node.key = key;
            this.value[ key ] = node;
        }
        else if ( this.type == 'array' ) {
            node.key = this.value.push( node ) - 1;
        }
        else {
            return false;
        }

        node.parentId = this.id;
        
        if ( staleParent != null ) {
            delete staleParent.value[ staleKey ];
        }

        return this;
    };  

    treeNode.prototype.appendTo = function ( node, key ) {

        node = node._structed ? node : new this.constructor( node );

        node.append( this, key );

        return this;
    };  

    var _traversalChildren = function ( traversalFunc, progress ) {

        var sub = this.value;

        if ( this.type == 'object' ) {
            for (var k in sub) {
                traversalFunc.call( sub[k], progress );
            }
        }
        else if ( this.type == 'array' ) {
            for (var i = sub.length - 1; i >= 0; i--) {
                traversalFunc.call( sub[i], progress );
            }
        }
    };  

    treeNode.prototype.bfTraversal = function ( progress ) {

        _traversalChildren.call(this, treeNode.prototype.bfTraversal, progress );

        return progress.call( this );
    };  

    treeNode.prototype.dfTraversal = function ( progress ) {

        var res = progress.call( this );

        _traversalChildren.call(this, treeNode.prototype.dfTraversal, progress );

        return res;
    };  

    treeNode.prototype.toPureJSON = function (  ) {

        var val;
        var value = this.value;

        if ( this.type == 'object' ) {
            val = {};
            for (var k in value) {
                val[k] = value[k].toPureJSON( );
            }
        }
        else if ( this.type == 'array' ) {
            val = [];
            for(var i=0,l=value.length;i<l;i++) {
                val[i] = value[i].toPureJSON( );
            }
        }
        else {
            val = value;
        }

        return val;
    };

    treeNode.prototype.toJSON = function(){
        treeNode.prototype.dfTraversal.call( this, function(){
            delete this.id;
            delete this.parentId;
        });
        return this;
    }

    treeNode.prototype.stringify = function(){
        return JSON.stringify( treeNode.prototype.toJSON.call( this ) );
    };

    treeNode.prototype.equalWith = function ( other ) {
        return this.stringify.call( other ) == this.stringify();
    };

    return treeNode;
})();
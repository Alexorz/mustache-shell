(function( exports ){

	if ( typeof define == 'function' ) {
		define( exports );
	}
	else {
		window.mustComb = exports;
	}

})( (function( exports ){

	exports = {};

    exports.tags = ['{{','}}'];

	var _Mustache = Mustache;

	// Scanner

    var nodeTypes = 'array|object|leaf|ignore|func';
    var metaReg = /^\s*meta\s*\=\s*\[(.+?)\]\s*$/;
    var intnlNodeReg = /^\_.+\_$/;

    /**
     * 将注释{{!meta=[...]}} 中的meta信息转换成对象并返回
     */
    var parseMetaStr = function(metaStr, meta){
        try {
            eval('meta = {' + metaStr + '}');

            if( !isNaN(meta.minLength) || !isNaN(meta.maxLength) ) {
                meta.isArray = true;
            }
        }
        catch(e){
            throw new Error('Illegally meta string:' + metaStr );   
        }
        finally {
            return meta || null;    
        }
        
    };

    /**
     * 确定该节点的类型，数组或叶子节点
     */
    var scanNodeType = function(token, metaType, undefined){

        // 若无子节点，则为叶子节点
        if(token.tokens === undefined) {
            return 'leaf';
        }
        else {
            if ( metaType && nodeTypes.indexOf(metaType) != -1 ) {
                return metaType;
            }
            else {
                return 'leaf';
            }
        }

    };

    var _appendToStruct = function( root, node, parent, key ){

        if ( parent.type == 'array' ) {

            var children = parent.children()[0];
            if ( !children ) {
                children = new treeNode({});
                parent.append(children);
            }
            children.append( node, key );
        }
        else if ( parent.type == 'object' ) {
            parent.append( node, key );
        }
        else {
            parent = parent.parent(function(){
                return this.type == 'array' || this.type == 'object';
            }) || root;

            _appendToStruct( root, node, parent, key );
        }
    }

    var scanTokenTree = function(tokenList, root, parent, undefined){

        if ( root == undefined ) {
            root = new treeNode({});
            root.metaCache = null;
        }

        parent = parent || root;
        
        for(var i=0,l=tokenList.length;i<l;i++) {
            var token = tokenList[i];

            // 若为注释节点，且包含meta信息，则将meta信息加入下一节点
            if(token.type == '!' && metaReg.test(token.value) && tokenList[i+1] !== undefined ) {
                root.metaCache = parseMetaStr( RegExp.$1 );
            }

            // 分别过滤如下节点: text节点, 注释节点, 内置属性节点, Meta中type为ignore或func的节点
            if(
                    token.type == 'text'
                 || token.type == '!'
                 || intnlNodeReg.test(token.value)
                 || ( root.metaCache && 'ignore|func'.indexOf(root.metaCache.type) != -1 )
            ) {
                continue;
            }

            root.metaCache = root.metaCache || {};


            if ( typeof root.metaCache.nameMap == 'object' ) {
                parent.meta.subNameMap = $.extend( parent.meta.subNameMap || {}, root.metaCache.nameMap );
            }
            
            if ( typeof parent.meta.subNameMap == 'object' ) {
                root.metaCache.name = parent.meta.subNameMap[token.value];
            }

            var metaType = root.metaCache['type'];

            var existNode = null;

            var isL = token.value == 'productList';

            if ( parent.type == 'object' ) {
                existNode = parent.children(function(){
                    return this.key != null && this.key == token.value;
                })[0];
            }

            if ( existNode ) {
                if ( root.metaCache ) {
                    existNode.meta = $.extend( existNode.meta, root.metaCache || {} );
                    root.metaCache = null;
                }

                if ( 'array|object'.indexOf(existNode.type) != -1 && token.tokens !== undefined ) {
                    scanTokenTree(token.tokens, root, existNode );
                }
            }

            else {

                // 创建节点，并扩展节点属性
                var nodeType = scanNodeType( token, metaType );
                var node = new treeNode(
                    {
                        'array' : {},
                        'object': {},
                        'leaf'  : ''
                    }[ nodeType ]
                );

                node.meta = root.metaCache;

                _appendToStruct( root, node, parent, token.value );

                // 清除缓存Meta
                if( root.metaCache !== null ){
                    root.metaCache = null;
                }

                // 递归子节点
                if(token.tokens !== undefined) {
                    scanTokenTree(token.tokens, root, node );
                }
            }

        }

        delete root.metaCache;

        return root;
    };

    /**
     * 扫描HTML模板，返回模板构树
     * (含Text节点和注释节点)
     */
    function parse(tplStr){
        return _Mustache.parse(tplStr);
    }

    /**
     * 扫描HTML模板，返回模板标签结构树
     * (不含Text节点和注释节点)
     */
    function scanMustTpl(tplStr){
        // 同步Tag
        Mustache.tags = exports.tags;

        return scanTokenTree( parse(tplStr) );
    }


	// Editor Area

    var leafCollectKey  = 'leafs';
    var tableCollectKey = 'tables';

    var importData = function( obj, node, key ){
        switch ( $.type(obj) ) {
            case 'array':
                var leaf = node.children('.J-kv-item[obj-type=array][obj-key='+key+']').find('.J-leaf:first');
                var kvItems = leaf.find('.J-val-list');
                var addBtn = leaf.find('.J-array-add');

                var itemLess = obj.length - kvItems.length;
                for(var i=0;i<itemLess;i++) {
                    addBtn.trigger('click');
                }

                kvItems = leaf.find('.J-val-list');

                kvItems.each(function(i){
                    importData( obj[i], $(this) );
                });

                break;
            case 'object':
                for (var key in obj) {
                    importData( obj[key], node, key );
                }
                break;
            default:
                var parent = node.children('.J-kv-item[obj-type=property]');
                parent = parent.length == 0 ? node : parent;
                parent.find('.J-val[obj-key='+key+']').val(obj);
        }
    };
            
    var getFormDataJSON = function(resObj, currObjNode){

        currObjNode.children('.J-kv-item').each(function(){
            var $this = $(this);
            var itemType = $this.attr('obj-type');

            switch (itemType) {
                case 'property':
                    var keys = $this.find('.J-key');
                    var vals = $this.find('.J-val');
                    keys.each(function(i){
                        resObj[ this.getAttribute('obj-key') ] = vals[i].value;
                    });
                    break;

                case 'object':
                    var sub = {};
                    resObj[ $this.attr('obj-key') ] = sub;
                    var childObjs = $this.find('.J-obj').eq(0).parent().children('.J-obj');

                    if ( childObjs.length ) {
                        childObjs.each(function( i ){
                            getFormDataJSON( sub, $(this) );
                        });
                    }
                    else {
                        getFormDataJSON( sub, $this );
                    }

                    break;

                case 'array':
                    var sub = [];
                    resObj[ $this.attr('obj-key') ] = sub;
                    var childObjs = $this.find('.J-obj').eq(0).parent().children('.J-obj');

                    if ( childObjs.length ) {
                        childObjs.each(function( i ){
                            sub[i] = {};
                            getFormDataJSON( sub[i], $(this) );
                        });
                    }
                    else {
                        var keys = $this.find('.J-key');
                        var valList = $this.find('.J-val-list');

                        valList.each(function( i ){
                            var vals = $(this).find('.J-val');
                            var obj = {};
                            vals.each(function( j ){
                                obj[ keys.eq(j).attr('obj-key') ] = this.value;
                            });
                            sub[i] = obj;
                        });
                    }

                    break;
            }

        });

        return resObj;
    };
    

    var editor = function(_conf){
        var conf = this.conf = $.extend(this.conf, _conf || {})

        var $this = this.$this = $(this);
        var $container = conf.container = $(conf.container);

        $container.find('input').live('blur', function(){
            $this.trigger( conf.contentChangeEvent );
        });

        $container.find('.J-array-add').live('click', function(){

            var $this = $(this);
            var prev = $this.prev();
            var next = $this.next();
            if ( prev[0] && prev[0].tagName == 'table' ) {
                prev = prev.children('tbody');
            }

            if ( prev[0] ) {
                $(next.html()).appendTo(prev);
            }

        });

    };

    editor.prototype = {

        conf : {
			container          : null,
			contentChangeEvent : 'contentChangeEvent',
			editorTplPtls      : {}
        },

        importData : function( obj, node ){
            importData( obj, this.conf.container.children('.J-obj') );
        },

        getDataJSON : function(){

        	var json = getFormDataJSON( {}, this.conf.container.children('.J-obj') );
	        
            return json;
        },

        build : function( mustacheTpl ){

			var tplStruct = scanMustTpl( mustacheTpl );

			var struct = this.getRenderStrucure( tplStruct ).toPureJSON();

	        struct._isRoot = true;
	        
	        struct.hasLeaf = function(  ){
	            return this[leafCollectKey].length !== 0;
	        };

	        struct.hasTable = function(  ){
	            return this[tableCollectKey].length !== 0;
	        };

	        struct.isFormTable = function(  ){
	            return this.meta && ( this.meta.type == 'object' || this.meta.length == 1 );
	        };

	        struct.isRoot = function(  ){
	            return this._isRoot === true;
	        };

	        this.conf.container[0].innerHTML =  Mustache.render( this.conf.editorTplPtls.main , struct, this.conf.editorTplPtls );

        },

        onChange : function( func ){
            this.$this.bind(this.conf.contentChangeEvent, func);
        },


        getRenderStrucure : function( srcStruct, fieldsInfo ){
            var self = this;
            var treeNode = srcStruct.constructor;
            var fieldsInfo = fieldsInfo || new treeNode( {} );
            var leafCollector  = fieldsInfo.child( leafCollectKey )  || new treeNode( [] ).appendTo( fieldsInfo, leafCollectKey  );
            var tableCollector = fieldsInfo.child( tableCollectKey ) || new treeNode( [] ).appendTo( fieldsInfo, tableCollectKey );

            var children = srcStruct.children();

            if ( children != null ) {
                children.map(function( node ){
                    
                    if ( node.type == 'object' ) {

                        if (  node.meta.type == 'array' ) {
                            tableCollector.append(

                                self.getRenderStrucure( node, new treeNode( {
                                    key    : node.key,
                                    name   : node.meta.name || node.key,
                                    meta   : node.meta,
                                    length : node.meta.length ? new Array(node.meta.length).join(1).split(1) : [""]
                                } )  )

                            );
                        }

                        else {
                            tableCollector.append(

                                self.getRenderStrucure( node, new treeNode( {
                                    key    : node.key,
                                    name   : node.meta.name || node.key,
                                    meta   : node.meta
                                } )  )

                            );
                        }
                    }

                    else {
                        leafCollector.append( {
                            key  : node.key,
                            name : node.meta.name || node.key,
                            meta : node.meta
                        } );
                    }

                });   
            }

            return fieldsInfo;
        }
    };

	exports.setMustache = function( m ){
		_Mustache = m;
	};

	exports.buildFormArea = function( mustacheTpl, formContain, partials ){

		var newEditor = new editor({
			container     : formContain,
			editorTplPtls : partials
		});

		newEditor.build( mustacheTpl );

		return newEditor;

	};

    exports.getFormStructure = getFormStructure;

    exports.getDataStructure = scanMustTpl;

	function getFormStructure( mustacheTpl ) {

		var tplStruct = scanMustTpl( mustacheTpl );

		var formStruct = editor.prototype.getRenderStrucure( tplStruct ).toPureJSON();

        formStruct.hasLeaf = function(  ){
            return this[leafCollectKey].length !== 0;
        };

        formStruct.hasTable = function(  ){
            return this[tableCollectKey].length !== 0;
        };

        formStruct.isFormTable = function(  ){
            return this.meta && ( this.meta.type == 'object' || this.meta.length == 1 );
        };

        formStruct._isRoot = true;

        formStruct.isRoot = function(  ){
            return this._isRoot === true;
        };

		return formStruct;

	}

	return exports;

})() );
(function( exports ){
    exports = mustComb;

    var nodeTypes = 'array|object|leaf|ignore|func|outter';
    var metaReg = /^\s*meta\s*\=\s*\[(.+?)\]\s*$/;
    var intnlNodeReg = /^\_.+\_$/;

    exports.viewExtraMap = {};

    /**
     * 扫描HTML模板，返回模板构树
     * (含Text节点和注释节点)
     */
    function parse(tplStr){
        return exports._Mustache.parse(tplStr);
    }

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

    var scanTokenTree = function( tplStr, tokenList, root, parent, undefined){

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

            // 分别过滤如下节点: text节点, token切换节点, 注释节点, 内置属性节点, Meta中type为ignore或func的节点
            if(
                    token.type == 'text'
                 || token.type == '='
                 || token.type == '!'
                 || intnlNodeReg.test(token.value)
                 || ( root.metaCache && 'ignore|func'.indexOf(root.metaCache.type) != -1 )
            ) {
                // 载入自定义方法
                if ( root.metaCache && root.metaCache.type == 'func' ) {
                    if ( exports.viewExtraMap[ tplStr ] == undefined) {
                        exports.viewExtraMap[ tplStr ] = {};
                    }
                    if ( token.tokens && token.tokens[0] != undefined ) {
                        exports.viewExtraMap[ tplStr ][ token.value ] = token.tokens[0].value;
                    }
                }

                if ( ( root.metaCache && root.metaCache.type == 'ignore' ) || intnlNodeReg.test(token.value) ) {
                    if ( token.tokens != undefined ) {
                        scanTokenTree( tplStr, token.tokens, root, parent );
                    }
                }

                continue;
            }


            root.metaCache = root.metaCache || {};

            if ( typeof root.metaCache.nameMap == 'object' ) {
                parent.meta.subNameMap = $.extend( parent.meta.subNameMap || {}, root.metaCache.nameMap );
            }
            
            if ( typeof parent.meta.subNameMap == 'object' ) {
                root.metaCache.name = parent.meta.subNameMap[token.value] || root.metaCache.name || '';
            }

            var metaType = root.metaCache['type'];

            var existNode = null;

            var isL = token.value == 'productList';

            if ( parent.type != 'object' ) {
                parent = parent.parent() || parent;
            }

            existNode = parent.children(function(){
                return this.key != null && this.key == token.value;
            })[0];

            if ( existNode ) {

                if ( root.metaCache ) {
                    existNode.meta = $.extend( existNode.meta, root.metaCache || {} );
                    root.metaCache = null;
                }

                if ( 'array|object'.indexOf(existNode.type) != -1 && token.tokens !== undefined ) {
                    scanTokenTree( tplStr, token.tokens, root, existNode );
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
                    }[ nodeType ] || ''
                );

                node.meta = root.metaCache;

                _appendToStruct( root, node, parent, token.value );

                // 清除缓存Meta
                if( root.metaCache !== null ){
                    root.metaCache = null;
                }

                // 递归子节点
                if(token.tokens !== undefined) {
                    scanTokenTree( tplStr, token.tokens, root, node );
                }
            }

        }

        delete root.metaCache;

        return root;
    };


    /**
     * 扫描HTML模板，返回模板标签结构树
     * (不含Text节点和注释节点)
     */
    exports.parse = function(tplStr){
        var staleTags,
            cachItem;

        // 优先从缓存获取
        cachItem = this.cache[ tplStr ];
        if ( cachItem && cachItem.tplStruct != null ) {
            return cachItem.tplStruct;
        }
        else {
            cachItem = this.cache[ tplStr ] = {
                tpltruct   : null
            }
        }

        // 同步Tag
        staleTags = exports._Mustache.tags;
        exports._Mustache.tags = exports.tags;

        cachItem.tplStruct = scanTokenTree( tplStr, parse(tplStr) );

        // 重置Tag
        exports._Mustache.tags = staleTags;

        return cachItem.tplStruct;
    };

    /**
     * 生成渲染模板所需要的示例JSON数据
     */
    exports.getDemoJSON = function(tplStr){
        var tplStruct,
            cachItem;

        cachItem = this.cache[ tplStr ];

        if ( cachItem && cachItem.demoJSON ) {
            return cachItem.demoJSON;
        }
        else {
            tplStruct = this.parse(tplStr);
            cachItem = this.cache[ tplStr ];
            cachItem.demoJSON = tplStruct.clone().bfTraversal(function(){
                if ( this.meta && this.meta.type == 'array' ) {
                    var meta   = this.meta;
                    var tmpArr = new treeNode([]);
                    var tmpLength = meta.length || meta.minLength || 1;

                    while( --tmpLength > -1 ) {
                        this.clone().appendTo( tmpArr );
                    }
                    
                    this.type = 'array';
                    this.value = tmpArr.value;
                }
                return this;
            }).toPureJSON();
        }

        return cachItem.demoJSON;
    };


})();
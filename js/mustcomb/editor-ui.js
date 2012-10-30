(function( exports ){
    exports = mustComb;

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

    exports.buildFormArea = function( mustacheTpl, formContain, partials ){

        var newEditor = new editor({
            container     : formContain,
            editorTplPtls : partials
        });

        newEditor.build( mustacheTpl );

        return newEditor;

    };

    exports.getFormStructure = getFormStructure;


})();
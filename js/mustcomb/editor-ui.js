
(function( exports ){
    exports = mustComb;



    exports.getFormStruct = function( tplStr ){
        var cachItem,
            tplStruct,
            formStruct;

        // 优先从缓存获取
        cachItem = this.cache[ tplStr ];
        if ( cachItem && cachItem.formStruct ) {
            return cachItem.formStruct;
        }
        else {
            tplStruct = this.parse( tplStr );
        }

        tplStruct = this.parse( tplStr );

        cachItem = this.cache[ tplStr ];

        cachItem.formStruct = _getFormStructRecursion( tplStruct );

        return cachItem.formStruct;
    };

    var _getFormStructRecursion = function( currNode, parentFormNode ){

        var currFormNode = {
            key       : currNode.key,
            name      : currNode.meta.name || currNode.key,
            type      : !parentFormNode ? 'object' : ( currNode.meta.type || 'prop' ),
            meta      : currNode.meta || {},
            subProp   : [],
            subObject : [],
            subArray  : []
        };

        if ( !parentFormNode ) {
            // for root
            delete currFormNode.name;
            delete currFormNode.key;
        }
        else {
            parentFormNode[
                {
                    'prop'   : 'subProp',
                    'object' : 'subObject',
                    'array'  : 'subArray'
                }[ currFormNode.type ]
            ].push( currFormNode );
        }

        parentFormNode = currFormNode;

        var subs = currNode.children();
        for (var i = 0, l = subs.length; i < l; i++) {
            _getFormStructRecursion( subs[i], parentFormNode );
        };

        return parentFormNode;
    };

    exports.uiRender = function(){
        var res;
        // 设置Tag
        var staleTags = exports._Mustache.tags;
        this._Mustache.tags = exports.tags;

        res = this._Mustache.render.apply( this._Mustache, arguments );

        // 重置Tag
        this._Mustache.tags = staleTags;

        return res;
    };

    var formStructMap = {};
    exports.buildEditorArea = function( tplStr, container ){

        var formStruct = this.getFormStruct( tplStr );
        formStructMap[$(container)[0]] = formStruct;

        $(container).empty().html(
            _buildEditorDOM( formStruct, true )
        );

        _bindEditorAction( container, formStruct );

        return {
            container : $(container),

            exportData : function( ){
                return _domValToJSON( this.container.find('.editor-ui-node:first') );
            },

            importData : function( obj ){
                return _importData( obj, this.container.find('.editor-ui-node:first') );
            }
        };
    };

    var _importData = function( obj, domNode, key ){
        var type = $.type( obj );
        var subNode;

        if ( type == 'object' ) {
            subNode = key?domNode.find('.editor-ui-node[data-key='+ (key||'') +']').eq(0):domNode;
            for ( var key in obj ) {
                _importData( obj[key], subNode, key );
            }
        }
        else if ( type == 'array' ) {
            subNode = domNode.find('.editor-ui-array[data-key='+ key +']').eq(0);
            var meta = {
                length : subNode.attr('data-length') || 1,
                minLength : subNode.attr('data-min-length') || null,
                maxLength : subNode.attr('data-max-length') || null
            };
            if ( subNode.attr('data-leaf') ) {
                _importDataForLeafArray( obj, subNode.find('table.editor-ui-leafarray-table').eq(0), meta );
            }
            else {
                _importDataForArray( obj, subNode.find('.editor-ui-array-item-list').eq(0), key, meta );
            }
        }
        else {
            domNode.find('.editor-ui-prop[data-key='+ key +'] input').eq(0).val( obj );
        }
    };

    var _importDataForArray = function( arr, listNode, key, meta ){
        var arrItems = listNode.children('.editor-ui-array-item');
        var itemAdder = listNode.children('.editor-ui-add-item')[0];

        if ( meta.maxLength ) {
            if ( arr.length > meta.maxLength ) {
                arr = arr.slice( 0, meta.maxLength );
            }
        }

        if ( meta.minLength ) {
            for (var i = meta.minLength - arr.length - 1; i >= 0; i--) {
                arr.push({});
            };
        }

        if ( arrItems.length < arr.length ) {
            for (var i = arr.length - arrItems.length - 1; i >= 0; i--) {
                _addArrayItemDom.call(itemAdder);
            };
        }
        else if ( arrItems.length > arr.length ) {
            for (var i = arrItems.length - arr.length - 1; i >= 0; i--) {
                arrItems.eq(-1).remove();
            };
        }

        arrItems.each(function( i ){
            _importData( arr[i], $(this), key );
        });

    };

    var _importDataForLeafArray = function( arr, tableNode, meta ){
        var keyCells = tableNode.find('.editor-ui-table-keycell');
        var valTrs   = tableNode.find('.editor-ui-table-valtr');

        if ( meta.maxLength ) {
            if ( arr.length > meta.maxLength ) {
                arr = arr.slice( 0, meta.maxLength );
            }
        }

        if ( meta.minLength ) {
            for (var i = meta.minLength - arr.length - 1; i >= 0; i--) {
                arr.push({});
            };
        }

        if ( valTrs.length < arr.length ) {
            for (var i = arr.length - valTrs.length - 1; i >= 0; i--) {
                valTrs.add( valTrs.eq(-1).clone().insertAfter( valTrs.eq(-1) ) );
            };
        }
        else if ( valTrs.length > arr.length ) {
            for (var i = valTrs.length - arr.length - 1; i >= 0; i--) {
                valTrs.eq(-1).remove();
            };
        }

        valTrs.each(function(i){
            var currObj = arr[i];
            $(this).find('input').each(function( j ){
                this.value = currObj[ keyCells.eq(j).attr('data-key') ] || '';
            });
        });

    };

    var _buildEditorDOM = function( formStruct ){
        var tplParts = window.mustComb_UItpl;
        return exports.uiRender(
            tplParts.node,
            _extraFormStruct( formStruct, true ),
            tplParts
        )
    }

    var _buildArrayItemDOM = function( formStruct ){
        var tplParts = window.mustComb_UItpl;
        return exports.uiRender(
            tplParts.arrayItem,
            _extraFormStruct( formStruct ),
            tplParts
        )
    }

    var _domValToJSON = function( domNode ){
        var currObj = {};

        _getPropNodes( domNode ).each(function( i ){

            currObj[ this.getAttribute('data-key') ] = $(this).children('input:first').val() || '';
        });

        _getObjNodes( domNode ).each(function( i ){

            currObj[ this.getAttribute('data-key') ]  = _domValToJSON( $(this).children('.editor-ui-node') );
        });

        _getArrayodes( domNode ).each(function( i ){

            var subArray = currObj[ this.getAttribute('data-key') ] = [];
            var leafBox = $(this).children('.editor-ui-leafarray-box');

            if ( leafBox.length ) {
                var keyList = [];
                leafBox.find('tr.editor-ui-table-keytr th').each(function( j ){
                    keyList[ j ] = this.getAttribute('data-key');
                });

                leafBox.find('tr.editor-ui-table-valtr').each(function( j ){
                    subArray[ j ] = {};
                    $(this).children('td').each(function( k ){
                        subArray[ j ][ keyList[ k ] ] = $(this).find('input:first').val();
                    });
                });
            }
            else {
                $(this).children('.editor-ui-array-item-list').children('.editor-ui-array-item').each(function( j ){
                    subArray[ j ] = _domValToJSON( $(this).children('.editor-ui-node') );
                });
            }
        });

        return currObj;
    };

    var bindedMap = {};
    var arrayAddDisableClass = 'editor-ui-array-add-disabled';
    var arrayDelDisableClass = 'editor-ui-array-del-disabled';
    var _bindEditorAction = function( container, formStruct ){
        if ( bindedMap[ container[0] ] ) {
            return ;
        }

        container.find('.editor-ui-del').live('click', function(){
            var arrList = $(this).parents('.editor-ui-array').eq(0);
            if ( !arrList.hasClass( arrayDelDisableClass ) ) {
                $(this).parents('.editor-ui-array-item').eq(0).remove();
            }
            checkArrayAddDelAble( arrList );
        });

        container.find('.editor-ui-add').live('click', function(){
            var arrList = $(this).parents('.editor-ui-array').eq(0);
            if ( !arrList.hasClass( arrayAddDisableClass ) ) {
                _addArrayItemDom.call(this);
            }
            checkArrayAddDelAble( arrList );
        });

        bindedMap[ container[0] ] = true;
    };

    var checkArrayAddDelAble = function ( arrList ) {
        var minLength = arrList.attr('data-min-length');
        var maxLength = arrList.attr('data-max-length');
        var currLength = arrList.children('.editor-ui-array-item-list').children('.editor-ui-array-item').length;
        if ( minLength ) {
            if ( currLength <= minLength ) {
                arrList.addClass( arrayDelDisableClass );
            }
            else {
                arrList.removeClass( arrayDelDisableClass );
            }
        }
        if ( maxLength ) {
            if ( currLength >= maxLength ) {
                arrList.addClass( arrayAddDisableClass );
            }
            else {
                arrList.removeClass( arrayAddDisableClass );
            }
        }
    };

    var _addArrayItemDom = function(){
        var $this = $(this);

        var formStruct = formStructMap[ $(this).parents('.editor-ui-node').eq(-1).parent()[0] ];

        var keyStack = [];
        var typeStack = [];
        var indexStack = [];
        var parentArrayNode = $(this).parents('.editor-ui-array').eq(0);
        var inserter;

        inserter = $(this).parents('.editor-ui-add-item').eq(0);

        if ( inserter.length == 0 ) {
            inserter = this;
        }

        typeStack.unshift('array');
        indexStack.unshift( parentArrayNode.attr('data-index') );

        $(this).parents().each(function(){
            var $this = $(this);
            var key  = $this.attr('data-key');
            var type = $this.attr('data-type');
            var index = $this.attr('data-index');
            if ( $this.hasClass('editor-ui-node') ) {
                if ( key ) {
                    typeStack.unshift(type);
                    indexStack.unshift(index);
                }
            }
        });
        var currNode = formStruct;
        var tmp;
        for (var i = 0; i < typeStack.length; i++) {
            tmp = currNode[ {
                'prop'   : 'subProp',
                'object' : 'subObject',
                'array'  : 'subArray'
            }[ typeStack[i]] ];
            currNode = tmp[ indexStack[i] ] ? tmp[ indexStack[i] ] : tmp[0];
        };

        $( _buildArrayItemDOM( currNode ) ).insertBefore( inserter );

    };

    var _getPropNodes = function( domNode ){

        return domNode.children('.editor-ui-prop-list').children('.editor-ui-prop');
    };

    var _getObjNodes = function( domNode ){

        return domNode.children('.editor-ui-obj-list').children('.editor-ui-obj');
    };

    var _getArrayodes = function( domNode ){

        return domNode.children('.editor-ui-array-list').children('.editor-ui-array');
    };

    var _extraFormStruct = function( model, isRoot ){
        // Clone
        model = JSON.parse( JSON.stringify( model ) );

        model._isRoot_ = !!isRoot;

        model._initLength_ = function(){
            var length = this.meta.length;
            var minLength = this.meta.minLength;
            var maxLength = this.meta.maxLength;

            length = length || minLength || 1;
            if ( minLength && minLength > length ) {
                length = minLength;
            }
            if ( maxLength && maxLength < length ) {
                length = maxLength;
            }

            var resArr = [];
            for (var i = length - 1; i >= 0; i--) {
                resArr.push(this);
            };
            return resArr;
        }

        model._hasSubProp_ = function(){
            return this.subProp.length > 0;
        };

        model._hasSubObject_ = function(){
            return this.subObject.length > 0;
        };

        model._hasSubArray_ = function(){
            return this.subArray.length > 0;
        };

        model._isProp_ = function(){
            return this.type == 'prop';
        };

        model._isObject_ = function(){
            return this.type == 'object';
        };

        model._isArray_ = function(){
            return this.type == 'array';
        };

        model._isLeafArray_ = function(){
            return this.subArray.length == 0 && this.subObject.length == 0;
        };

        return model;
    };

})();
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
            meta      : currNode.meta,
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

    exports.buildEditorArea = function( tplStr, container ){

        var tplParts = window.mustComb_UItpl;

        $(container).empty().html(
            this.uiRender(
                tplParts.main,
                _extraFormStruct( this.getFormStruct( tplStr ) ),
                tplParts
            )
        );

        return {
            exportData : function( ){
                return _domValToJSON( $(container).find('.editor-ui-node:first') );
            },

            importData : function( obj ){
                return _importData( obj, $(container).find('.editor-ui-node:first') );
            }
        };
    };

    var _importData = function( obj, domNode ){
        
    };

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
                $(this).children('.editor-ui-item-list').children('.editor-ui-array-item').each(function( j ){
                    subArray[ j ] = _domValToJSON( $(this).children('.editor-ui-node') );
                });
            }
        });

        return currObj;
    };

    var _bindEditorAction = function(){

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

    var _extraFormStruct = function( model ){
        // Clone
        model = JSON.parse( JSON.stringify( model ) );

        model._isRoot_ = true;

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
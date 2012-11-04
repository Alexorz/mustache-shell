
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

        var editor = {

            currFocusedTable : null,

            container : $(container),

            exportData : function( ){
                return _domValToJSON( this.container.find('.editor-ui-node:first') );
            },

            importData : function( obj ){
                return _importData( obj, this.container.find('.editor-ui-node:first') );
            }
        };

        _bindEditorAction.call( editor, container, formStruct );

        return editor;
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
    var trSelectClass = 'editor-ui-tr-selected';
    var _bindEditorAction = function( container, formStruct ){

        var self = this;

        if ( bindedMap[ container[0] ] ) {
            return ;
        }

        container.find('table').live('mouseover', function(){
            self.currFocusedTable = $(this);
        });

        container.find('.editor-ui-del').live('click', function(){
            var arrList = $(this).parents('.editor-ui-array').eq(0);
            if ( !arrList.hasClass( arrayDelDisableClass ) ) {
                $(this).parents('.editor-ui-array-item').eq(0).remove();
            }
            _checkArrayAddDelAble( arrList );
        });

        container.find('.editor-ui-add').live('click', function(){
            var arrList = $(this).parents('.editor-ui-array').eq(0);
            if ( !arrList.hasClass( arrayAddDisableClass ) ) {
                _addArrayItemDom.call(this);
            }
            _checkArrayAddDelAble( arrList );
        });

        container.find('.editor-ui-up').live('click', function(){
            var arrItem = $(this).parents('.editor-ui-array-item').eq(0);
            var prev = arrItem.prev('.editor-ui-array-item');
            if ( prev ) {
                arrItem.insertBefore( prev );
            }
        });

        container.find('.editor-ui-down').live('click', function(){
            var arrItem = $(this).parents('.editor-ui-array-item').eq(0);
            var next = arrItem.next('.editor-ui-array-item');
            if ( next ) {
                arrItem.insertAfter( next );
            }
        });

        container.find('tr.editor-ui-table-valtr').live('click', function( e ){
            var tr = $(this);
            if ( e.ctrlKey ) {
                tr.toggleClass(trSelectClass);
            }
        });

        $(window).keydown(function( e ){
            var currFocusedTable = self.currFocusedTable;
            if ( currFocusedTable ) {
                // move up
                if ( e.which == 38 ) {
                    if ( e.ctrlKey ) {
                        _moveLineUp( currFocusedTable.children('tbody').children('tr.'+trSelectClass) );
                        e.preventDefault();
                        return false;
                    }
                }
                // move down
                else if ( e.which == 40 ) {
                    if ( e.ctrlKey ) {
                        _moveLineDown( currFocusedTable.children('tbody').children('tr.'+trSelectClass) );
                        e.preventDefault();
                        return false;
                    }
                }
                // insert
                else if ( e.which == 45 ) {
                    var rows = currFocusedTable.find('.editor-ui-table-valtr');
                    var maxLength = currFocusedTable.attr('data-max-length');
                    if ( !maxLength || maxLength > rows.length ) {
                        rows.eq(-1).clone().find('input').val('').end().insertAfter( rows.eq(-1) );
                    }
                    
                }
                // delete
                else if ( e.which == 46 ) {
                    var rows = currFocusedTable.find('.editor-ui-table-valtr');
                    var selectedRows = currFocusedTable.find('tr.'+trSelectClass);
                    var minLength = Number( currFocusedTable.attr('data-min-length') );
                    if ( minLength ) {
                        selectedRows.removeClass(trSelectClass).find('input').val('');
                        for (var i = selectedRows.length - ( selectedRows.length + minLength - rows.length ) - 1; i >= 0; i--) {
                            selectedRows.eq(i).remove();
                        };
                    }
                    else {
                        selectedRows.remove();
                    }
                }
            }
        });

        // Parse form Excel
        container.find('tr.editor-ui-table-valtr input').live('paste', function( e ){

            var parseStr = e.originalEvent.clipboardData.getData("text/plain"),
                input = $(this),
                currTd = input.parent(),
                currTr = currTd.parent(),
                trs = currTr.add( currTr.nextAll('tr') ),
                fromTdIndex = currTd.index(),
                parseTable;

            parseTable = parseStr.split(/\r\n|\n|\r/);

            for (var i = parseTable.length - 1; i >= 0; i--) {
                parseTable[i] = parseTable[i].split('\t');
            };

            if ( parseTable.length > 1 || (parseTable[0] || []).length > 1 )  {

                trs.each(function( i ){
                    var tds = $(this).children('td'),
                        currLine = parseTable[ i ];
                    if ( currLine ) {
                        for (var i = currLine.length - 1; i >= 0; i--) {
                            tds.eq( fromTdIndex + i ).children('input').val( currLine[i].trim() );
                        };
                    }
                });

                setTimeout(function(){
                    currTd.children('input').val( parseTable[0][0].trim() );
                }, 10);

            }
        });
        
        // Click input then select all
        var tmo;
        container.find('tr.editor-ui-table-valtr input').live('focus', function(){
            var self = this;
            clearTimeout(tmo);
            tmo = setTimeout(function(){
                $(self).select();
            }, 10);
        });

        // Unselect all tr
        container.click(function( e ){
            var currFocusedTable = self.currFocusedTable;
            if ( e.ctrlKey && $(e.target).parents('table').index( currFocusedTable[0] ) == -1 ) {
                currFocusedTable.children('tbody').children('tr.'+trSelectClass).removeClass(trSelectClass);
            }
        });

        bindedMap[ container[0] ] = true;
    };

    var _moveLineUp = function ( tr ) {
        var currTr, trPrev, trDetail;
        tr = $(tr);
        for (var i = 0, len = tr.length; i < len; i++) {
            currTr = $(tr[i]);
                trPrev = currTr.prev();
                if ( trPrev.length && trPrev.children('th').length === 0 && !trPrev.hasClass(trSelectClass) ) {
                    currTr.insertBefore( trPrev );
                }
        };
    }
    var _moveLineDown = function ( tr ) {
        var currTr, trNext, trDetail;
        tr = $(tr);
        for (var i = tr.length - 1; i >= 0; i--) {
            currTr = $(tr[i]);
                trNext = currTr.next();
                if ( trNext.length && !trNext.hasClass(trSelectClass) ) {
                    currTr.insertAfter( trNext );
                }
        };
    }

    var _checkArrayAddDelAble = function ( arrList ) {
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
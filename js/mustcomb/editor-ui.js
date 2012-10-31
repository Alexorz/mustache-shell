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
        cachItem.formStruct = _getFormStruct( tplStruct );

        return cachItem.formStruct;
    };

    var _getFormStruct = function( tplStruct ){
        var formStruct = {
            root   : true,
            key    : 'root',
            name   : '',
            type   : 'object',
            props  : [],
            objs   : [],
            arrays : []
        };

        tplStruct.bfTraversal(function(){})


        return tplStruct;
    };

})();
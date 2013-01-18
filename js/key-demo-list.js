define([
        
        {
            name     : 'Hello world',
            muTplStr : '{{someone}}是一个{{role}}.',
            formData :  {    "someone": "阿兵哥",    "role": "屌丝"}
        },
        
        {
            name     : '关于meta',
            muTplStr : '{{!meta=[  ]}} 标签是mustache-shell中一切的基础\n\n通过填充meta标签中的JSON数据，给下一个标签添加描述信息，例如：\n\n{{!meta=[ property1:\'value\', property2:\'value\' ]}}\n{{ooxx}}\n\n用后类似如下效果\nooxx.meta = {\n    property1 : \'value\',\n    property2 : \'value\'\n}',
            formData :  {}
        },
        
        {
            name     : '数组类型 - Array',
            muTplStr : '使用 type:\'array\' 定义一个数组标签：\n\n{{!meta=[ type:\'array\' ]}}\n{{#peoples}}\n    {{someone}}是一个{{role}}.\n{{/peoples}}',
            formData :  {    "peoples": [{        "someone": "阿兵哥",        "role": "屌丝"    }, {        "someone": "唐琪",        "role": "屌丝"    }]}
        },
        
        {
            name     : '对象类型 - Object',
            muTplStr : '使用 type:\'object\' 定义一个对象标签：\n\n{{!meta=[ type:\'object\' ]}}\n{{#peoples}}\n    {{someone}}和{{anotherone}}都是{{role}}.\n{{/peoples}}',
            formData :  {    "peoples": {        "someone": "阿兵哥",        "anotherone": "唐琪",        "role": "屌丝"    }}
        },
        
        {
            name     : '字段别名 - Name',
            muTplStr : '使用 name:\'别名xxx\' 定义一个标签在表单中的显示名：\n\n{{!meta=[ type:\'object\', name:\'两个屌丝\' ]}}\n{{#peoples-1}}\n    {{someone}}和{{anotherone}}都是屌丝.\n{{/peoples-1}}',
            formData :  {    "peoples-1": {        "someone": "阿兵哥",        "anotherone": "唐琪"    },    "peoples-2": {        "someone": "阿兵哥",        "anotherone": "唐琪"    }}
        },
        
        {
            name     : '别名字典 - NameMap',
            muTplStr : '使用 nameMap:{ name1:\'别名1\', name2:\'别名2\' } 定义一组同层级字段在表单中的显示名：\n\n{{!meta=[ nameMap:{ someone:\'屌丝1号\', anotherone:\'屌丝2号\' } ]}}\n{{someone}}和{{anotherone}}两个屌丝.\n\n\n\n使用 subNameMap:{ name1:\'别名1\', name2:\'别名2\' } 定义一组同层级\"子字段\"在表单中的显示名：\n\n{{!meta=[ type:\'object\', name:\'两个屌丝\', subNameMap:{ someone:\'屌丝1号\', anotherone:\'屌丝2号\' } ]}}\n{{#peoples-2}}\n    {{someone}}和{{anotherone}}都是屌丝.\n{{/peoples-2}}',
            formData :  {    "someone": "阿兵哥",    "anotherone": "唐琪",    "peoples-2": {        "someone": "阿兵哥",        "anotherone": "唐琪"    }}
        },
        
        {
            name     : '数组长度限制 - Length',
            muTplStr : '使用 minLength:n, maxLength:n 定义数组长度限制信息：\n\n{{!meta=[ type:\'array\', minLength:1, maxLength:3 ]}}\n{{#peoples}}\n    {{someone}}\n{{/peoples}}',
            formData :  {}
        },
        
        {
            name     : '自定义方法 - Func',
            muTplStr : '使用 type:\'func\' 定义一个自定义方法，并且使用它：\n( func的标签命名必须为: _方法名_ 格式 )\n\n{{!meta=[ type:\'func\' ]}}\n{{#_isTQ_}}\n    function(){\n        return this.someone == \'唐琪\';\n    }\n{{/_isTQ_}}\n\n{{!meta=[ type:\'array\' ]}}\n{{#peoples}}\n    {{someone}}{{#_isTQ_}}不{{/_isTQ_}}是屌丝.\n\n{{/peoples}}',
            formData :  {    "peoples": [{        "someone": "唐琪"    }, {        "someone": "阿兵哥"    }]}
        },
        
        {
            name     : '内置方法/属性',
            muTplStr : '一些内置方法: _isFirst_ , _isLast_          \n一些内置属性: _index_   , _nIndex_ , _length_\n\n\n{{!meta=[ type:\'array\' ]}}\n{{#peoples}}{{someone}}{{^_isLast_}}、{{/_isLast_}}{{/peoples}}{{#peoples}}{{#_isFirst_}}{{_length_}}{{/_isFirst_}}{{/peoples}}个屌丝.',
            formData :  {    "peoples": [{        "someone": "唐琪"    }, {        "someone": "阿兵哥"    }, {        "someone": "小孕妇"    }]}
        },
        
        {
            name     : '注释',
            muTplStr : '被以下两组标签包围的Mustache模板代码会被无视（不被解析或渲染）：\n\n<!-- # Mustache-IGNORE -->\n{{ooxx}}\n<!-- / Mustache-IGNORE -->\n\n/* # Mustache-IGNORE */\n{{ooxx}}\n/* / Mustache-IGNORE */\n\n{{normal}}',
            formData :  {    "normal": "和谐万岁"}
        }
]);
/*
    function(){
       return !this.json || /^\s*$/.test( this.json );
    }

*/
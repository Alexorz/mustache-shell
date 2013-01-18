define([
    {{!meta=[ type:'array', name:'Demo List', subNameMap:{ name:'Name', tmpl:'Template', json:'Data JSON' } ]}}
    {{#demoList}}
        {{_escapeQuoat_}}
        {
            name     : '{{{name}}}',
            muTplStr : '{{{tmpl}}}',
            formData :  {{{json}}}{{#_isJsonEmpty_}}{}{{/_isJsonEmpty_}}
        }{{^_isLast_}},{{/_isLast_}}
    {{/demoList}}
]);
/*
{{!meta=[ type:'func' ]}}
{{#_isJsonEmpty_}}
    function(){
       return !this.json || /^\s*$/.test( this.json );
    }
{{/_isJsonEmpty_}}

{{!meta=[ type:'func' ]}}
{{#_escapeQuoat_}}
    function(){
        if ( this.tmpl ) {
            this.tmpl = this.tmpl.replace(/('|")/g,'\\$1');
        }
        if ( this.name ) {
            this.name = this.name.replace(/('|")/g,'\\$1');
        }
        if ( this.json ) {
            this.json = this.json.replace(/('|")/g,'\\$1');
        }
        return '';
    }
{{/_escapeQuoat_}}
*/
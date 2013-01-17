define([
    {
        name : 'Hello world',
        muTplStr : 'Alexorz is a {{role}}.',
        formData : { role : 'Coder' }
    },
    {
        name : 'Array',
        muTplStr : '{{!meta=[ type:"array" ]}}\n{{#words}}\n  {{someone}} is a {{role}}.<br />\n{{/words}}',
        formData : { words : [ { someone : 'Alexorz', role: 'Coder' }, { someone : 'Jackie', role: 'Actor' } ] }
    },
    {
        name : 'Object',
        muTplStr : '{{!meta=[ type:"object" ]}}\n{{#word}}\n  {{someone}} is a {{role}}.\n{{/word}}',
        formData : { word : { someone : 'Alexorz', role: 'Coder' } }
    },
    {
        name : 'Name',
        muTplStr : '{{!meta=[ name:"What kind of people" ]}}\nAlexorz is a {{role}}.',
        formData : { role : 'Coder' }
    }

]);
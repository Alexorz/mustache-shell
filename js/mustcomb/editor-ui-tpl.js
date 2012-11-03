;(function( tpl ){

    if ( typeof define == 'function' ) {
        define( tpl );
    }
    else {
        window.mustComb_UItpl = tpl;
    }

})({
    node : [
        ,'<div class="editor-ui-node" data-key="{{key}}" data-type="{{type}}" data-index="{{_index_}}">'
        ,'  {{#_hasSubProp_}}'
        ,'  <ul class="editor-ui-prop-list">'
        ,'  {{#subProp}}'
        ,'      <li class="editor-ui-prop" data-key="{{key}}">'
        ,'          <span class="editor-ui-keytitle">'
        ,'              {{name}}'
        ,'          </span> : <input type=""><br>'
        ,'      </li>'
        ,'  {{/subProp}}'
        ,'  </ul>'
        ,'  {{/_hasSubProp_}}'

        ,'  {{#_hasSubObject_}}'
        ,'  <ul class="editor-ui-obj-list">'
        ,'  {{#subObject}}'
        ,'      <li class="editor-ui-obj" data-key="{{key}}">'
        ,'          <span class="editor-ui-keytitle">'
        ,'              {{name}} :'
        ,'          </span>'
        ,'          {{> node}}'
        ,'      </li>'
        ,'  {{/subObject}}'
        ,'  </ul>'
        ,'  {{/_hasSubObject_}}'


        ,'  {{#_hasSubArray_}}'
        ,'  <ul class="editor-ui-array-list">'
        ,'  {{#subArray}}'
        ,'      <li class="editor-ui-array" data-key="{{key}}" data-index="{{_index_}}">'
        ,'          <span class="editor-ui-keytitle">'
        ,'              {{name}} :'
        ,'          </span>'
        ,'          {{#_isLeafArray_}}'
        ,'              <div class="editor-ui-leafarray-box">'
        ,'                  <table class="editor-ui-leafarray-table">'
        ,'                      <tr class="editor-ui-table-keytr">'
        ,'                          {{#subProp}}'
        ,'                          <th data-key="{{key}}">{{name}}</th>'
        ,'                          {{/subProp}}'
        ,'                      </tr>'
        ,'                      <tr class="editor-ui-table-valtr">'
        ,'                          {{#subProp}}'
        ,'                          <td><input type=""></td>'
        ,'                          {{/subProp}}'
        ,'                      </tr>'
        ,'                  </table>'
        ,'              </div>'
        ,'          {{/_isLeafArray_}}'
        ,'          {{^_isLeafArray_}}'
        ,'          <ul class="editor-ui-item-list">'
        ,'              {{> arrayItem}}'
        ,'              <li class="editor-ui-add-item"><span class="editor-ui-add"><i class="ch-icon-plus"></i></span></li>'
        ,'          </ul>'
        ,'          {{/_isLeafArray_}}'
        ,'      </li>'
        ,'  {{/subArray}}'
        ,'  </ul>'
        ,'  {{/_hasSubArray_}}'
        ,'</div>'
    ].join(''),

    arrayItem : [
        ,'  <li class="editor-ui-array-item">'
        ,'      <span class="editor-ui-del-item"> <span class="editor-ui-del"><i class="ch-icon-trash"></i></span> </span>'
        ,'      {{> node}}'
        ,'  </li>'
    ].join('')

});
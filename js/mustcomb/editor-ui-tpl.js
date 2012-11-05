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
        ,'          </span> : <input type="text">'
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
        ,'      <li class="editor-ui-array {{^_addAble_}}editor-ui-array-add-disabled{{/_addAble_}} {{^_delAble_}}editor-ui-array-del-disabled{{/_delAble_}}" data-key="{{key}}" data-index="{{_index_}}" {{#_isLeafArray_}}data-leaf="true"{{/_isLeafArray_}}  {{#meta}}data-length="{{length}}" data-min-length="{{minLength}}" data-max-length="{{maxLength}}"{{/meta}}>'
        ,'          <span class="editor-ui-keytitle">'
        ,'              {{name}} :'
        ,'          </span>'
        ,'          {{#_isLeafArray_}}'
        ,'              <div class="editor-ui-leafarray-box">'
        ,'                  <table class="editor-ui-leafarray-table" {{#meta}}data-length="{{length}}" data-min-length="{{minLength}}" data-max-length="{{maxLength}}"{{/meta}}>'
        ,'                      <tr class="editor-ui-table-keytr">'
        ,'                          {{#subProp}}'
        ,'                          <th data-key="{{key}}" class="editor-ui-table-keycell">{{name}}</th>'
        ,'                          {{/subProp}}'
        ,'                      </tr>'
        ,'                      {{#_initLength_}}'
        ,'                      <tr class="editor-ui-table-valtr">'
        ,'                          {{#subProp}}'
        ,'                          <td><input type="text"></td>'
        ,'                          {{/subProp}}'
        ,'                      </tr>'
        ,'                      {{/_initLength_}}'
        ,'                  </table>'
        ,'              </div>'
        ,'          {{/_isLeafArray_}}'
        ,'          {{^_isLeafArray_}}'
        ,'          <ul class="editor-ui-array-item-list">'
        ,'              {{#_initLength_}}'
        ,'              {{> arrayItem}}'
        ,'              {{/_initLength_}}'
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
        ,'      <span class="editor-ui-options">'
        ,'          <span class="editor-ui-up editor-ui-option-item"><i class="ch-icon-chevron-up"></i></span>'
        ,'          <span class="editor-ui-del editor-ui-option-item"><i class="ch-icon-trash"></i></span>'
        ,'          <span class="editor-ui-down editor-ui-option-item"><i class="ch-icon-chevron-down"></i></span>'
        ,'      </span>'
        ,'      {{> node}}'
        ,'  </li>'
    ].join('')

});
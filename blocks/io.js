
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/uprog
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';


Blockly.Blocks['uprog_io_get'] = {
  /**
   * Block for variable getter.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
    this.setColour(60);
    this.appendDummyInput()
      .appendField(new Blockly.FieldIo(null,'w'), 'VAR');
    this.setOutput(true);
    this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_GET_CREATE_SET;
  },
  contextMenuType_: 'variables_set',
  /**
   * Add menu option to create getter/setter block for this setter/getter.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
  // customContextMenu: function(options) {
  //   var option = {enabled: true};
  //   var name = this.getFieldValue('VAR');
  //   option.text = this.contextMenuMsg_.replace('%1', name);
  //   var xmlField = goog.dom.createDom('field', null, name);
  //   xmlField.setAttribute('name', 'VAR');
  //   var xmlBlock = goog.dom.createDom('block', null, xmlField);
  //   xmlBlock.setAttribute('type', this.contextMenuType_);
  //   option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
  //   options.push(option);
  // }
  // customContextMenu: Blockly.Blocks['variables_set'].customContextMenu,
};


Blockly.JavaScript['uprog_io_get'] = function ( block )
{
  var key1 = block.getFieldValue('VAR');
  var code = "__hw_read_io__('"+key1+"')";
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['uprog_io_set'] = {
  init: function() {
    this.appendValueInput("VALUE").setCheck(null)
      .appendField(new Blockly.FieldIo(null,'w'), "VAR")
      .appendField(new Blockly.FieldImage( "blocks/variable_set.svg", 20, 16, "<-" ));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    if ( App.language === 'fr' ) {
      //this.setHelpUrl(Blockly.Msg.CONTROLS_WHILEUNTIL_HELPURL);
      this.setTooltip("Fixe l'état logique de la broche.");
      // this.message0 = "Fix %1 to %2";
    }
    else {
      this.setTooltip("Set the pin state.");
    }
  },
  contextMenuType_: 'variables_get',
  // customContextMenu: Blockly.Blocks['variables_get'].customContextMenu,
};


Blockly.JavaScript['uprog_io_set'] = function ( block )
{
  var key1 = block.getFieldValue('VAR');
  var value = Blockly.JavaScript.valueToCode(
    block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  var code = "__hw_write_io__('"+key1+"',"+value+");\n";

  return code;
};


/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/uprog
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/*  A special version of Blockly's 'set variable' block where the text is
 *  replaced by an arrow.
 */

'use strict';


Blockly.Blocks['uprog_var_get'] = {
  init: function() {
    this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
    this.setColour(Blockly.Blocks.variables.HUE);
    this.appendDummyInput()
      .appendField(new Blockly.FieldVariable(Blockly.Msg.VARIABLES_DEFAULT_NAME), 'VAR');
    this.setOutput(true);
    // this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
    // this.contextMenuMsg_ = Blockly.Msg.VARIABLES_GET_CREATE_SET;
    this.i18n();
  },
  i18n: function() {
    if ( App.language === 'fr' ) {
      this.setTooltip("Valeur de la variable.");
      this.contextMenuMsg_ = "Créer un bloc « %1 ← … »";
    }
    else {
      this.setTooltip("Value of the variable.");
      this.contextMenuMsg_ = "Create a bloc « %1 ← … »";
    }
  },
  contextMenuType_: 'variables_set',
  /**
   * Add menu option to create getter/setter block for this setter/getter.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
  customContextMenu: function(options) {
    var option = {enabled: true};
    var name = this.getFieldValue('VAR');
    option.text = this.contextMenuMsg_.replace('%1', name);
    var xmlField = goog.dom.createDom('field', null, name);
    xmlField.setAttribute('name', 'VAR');
    var xmlBlock = goog.dom.createDom('block', null, xmlField);
    xmlBlock.setAttribute('type', this.contextMenuType_);
    option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
    options.push(option);
  }
};


Blockly.JavaScript['uprog_var_get'] = function(block) {
  // Variable getter.
  var code = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};


Blockly.Blocks['uprog_var_set'] = {
  init: function() {
    this.appendValueInput("VALUE").setCheck(null)
	.appendField(new Blockly.FieldVariable( Blockly.Msg.VARIABLES_DEFAULT_NAME ),
		     "VAR")
	.appendField(new Blockly.FieldImage( "blocks/variable_set.svg", 20, 16, "←" ));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(345);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    this.i18n();
  },
  i18n: function() {
    if ( App.language === 'fr' ) {
      //this.setHelpUrl(Blockly.Msg.CONTROLS_WHILEUNTIL_HELPURL);
      this.setTooltip("Change la valeur de la variable.");
      this.message0 = "Fix %1 to %2";
    }
    else {
      this.setTooltip("Sets this variable to be equal to the input.");
    }
  },
  contextMenuType_: 'variables_get',
  customContextMenu: Blockly.Blocks['uprog_var_get'].customContextMenu,
};


Blockly.JavaScript['uprog_var_set'] = function ( block )
{
  var key1 = block.getFieldValue('VAR');
  var key2 = Blockly.JavaScript.variableDB_.getName(key1, Blockly.Variables.NAME_TYPE);
  var value = Blockly.JavaScript.valueToCode(
    block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';

  var code = key2+'='+value+';\n';
  code += "__monitor__('"+key1+"', "+key2+");\n";

  return code;
};

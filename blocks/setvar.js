
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

Blockly.Blocks['uprog_setvar'] = {
  init: function() {
    this.appendValueInput("VALUE").setCheck(null)
	.appendField(new Blockly.FieldVariable( Blockly.Msg.VARIABLES_DEFAULT_NAME ),
		     "VAR")
	.appendField(new Blockly.FieldImage( "blocks/variable_set.svg", 20, 16, "<-" ));
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(345);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    this.i18n();
  },
  contextMenuType_: 'variables_get',
  customContextMenu: Blockly.Blocks['variables_get'].customContextMenu,
  i18n: function() {
    if ( App.language === 'fr' ) {
      //this.setHelpUrl(Blockly.Msg.CONTROLS_WHILEUNTIL_HELPURL);
      this.setTooltip("Change la valeur de la variable.");
      this.message0 = "Fix %1 to %2";
    }
    else {
      this.setTooltip("Sets this variable to be equal to the input.");
    }
  }
};


Blockly.JavaScript['uprog_setvar'] = function ( block )
{
  var key1 = block.getFieldValue('VAR');
  var key2 = Blockly.JavaScript.variableDB_.getName(key1, Blockly.Variables.NAME_TYPE);
  var value = Blockly.JavaScript.valueToCode(
    block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';

  var code = key2+'='+value+';\n';
  //  if ( zdebugger.x_generate && zdebugger.monitors.hasOwnProperty(key1) )
  code += "__monitor__('"+key1+"', "+key2+");\n";

  return code;
};

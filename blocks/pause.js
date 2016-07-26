
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

//  Block: pause
//
Blockly.Blocks['uprog_pause'] = {
  init: function() {
    var x = this.appendValueInput("ARG").setCheck("Number");
    var y = this.appendDummyInput();
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(45);// App.Hues.pause
    if ( App.language === 'fr' ) {
      //this.setHelpUrl(Blockly.Msg.CONTROLS_FLOW_STATEMENTS_HELPURL);
      x.appendField("Pause");
      y.appendField(
	new Blockly.FieldDropdown(
	  [["secondes", "s"],
	   ["millisecondes", "ms"],
	   ["microsecondes", "us"],
	   ["cycles CPU", "cy"]]),
	"UNIT");
      this.setTooltip("Suspend l'éxécution un certain temps.");
    }
    else {
      x.appendField("Pause");
      y.appendField(
	new Blockly.FieldDropdown(
	  [["seconds", "s"],
	   ["milliseconds", "ms"],
	   ["microseconds", "us"],
	   ["CPU cycles", "cy"]]),
	"UNIT");
      this.setTooltip("Suspend execution for a while.");
    }
    this.i18n();
  },
  i18n: function() {
    if ( App.language === 'fr' ) {
    }
    else {
    }
  }
};


//  Generator: Javascript
//
Blockly.JavaScript['uprog_pause'] = function(block)
{
  var value_arg = Blockly.JavaScript.valueToCode(block, 'ARG', Blockly.JavaScript.ORDER_ATOMIC);
  var dropdown_unit = block.getFieldValue('UNIT');

  var code = '__pause__("'+value_arg+'", "'+dropdown_unit+'");\n';

  return code;
};


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

//  Block: while
//
Blockly.Blocks['uprog_while'] = {
  init: function() {
    //this.setHelpUrl(Blockly.Msg.CONTROLS_WHILEUNTIL_HELPURL);
    this.setColour(Blockly.Blocks.loops.HUE);
    var x = this.appendValueInput('BOOL')
	.setCheck('Boolean');
    if ( App.language === 'fr' ) {
      x.appendField("TANT QUE");
      this.appendStatementInput('DO');
      this.setTooltip("Tant que la condition logique vaut « vrai », exécute "+
		      "l'ensemble des instruction et recommence.");
    }
    else {
      x.appendField("WHILE");
      this.appendStatementInput('DO');
      this.setTooltip("While the logical condition is \"true\", execute the "+
		      "whole sequence and restart.");
    }
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.i18n();
  },
  i18n: function() {
    if ( App.language === 'fr' ) {
    }
    else {
    }
  }
};


Blockly.JavaScript['uprog_while'] = function( block ) {
  // Do while/until loop.
  var until = block.getFieldValue('MODE') == 'UNTIL';
  var argument0 = Blockly.JavaScript.valueToCode(block, 'BOOL',
						 Blockly.JavaScript.ORDER_NONE) || 'false';
  var branch = Blockly.JavaScript.statementToCode(block, 'DO');
  branch = Blockly.JavaScript.addLoopTrap(branch, block.id);
  return 'while (' + argument0 + ') {\n' + branch + '}\n';
};

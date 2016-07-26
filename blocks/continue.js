
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

Blockly.Blocks['uprog_continue'] = {
  init: function() {
    //this.setHelpUrl(Blockly.Msg.CONTROLS_FLOW_STATEMENTS_HELPURL);
    this.setColour(Blockly.Blocks.loops.HUE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    var x = this.appendDummyInput();
    if ( App.language === 'fr' ) {
      //this.setHelpUrl(Blockly.Msg.CONTROLS_FLOW_STATEMENTS_HELPURL);
      x.appendField("SUIVANT");
      this.setTooltip("Passe immédiatement à l'itération suivante.")
    }
    else {
      x.appendField("CONTINUE");
      this.setTooltip("Skip the rest of this loop, and continue with the next iteration.")
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


Blockly.JavaScript['uprog_continue'] = function( block ) {
  return 'continue;\n';
};

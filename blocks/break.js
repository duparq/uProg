
Blockly.Blocks['uprog_break'] = {
  init: function() {
    this.setColour(Blockly.Blocks.loops.HUE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    var x = this.appendDummyInput();
    this.i18n();
  },
  i18n: function() {
    if ( App.language === 'fr' ) {
      //this.setHelpUrl(Blockly.Msg.CONTROLS_FLOW_STATEMENTS_HELPURL);
      x.appendField("SORTIR");
      this.setTooltip("Sort de la boucle.");
    }
    else {
      x.appendField("BREAK");
      this.setTooltip("Break out of loop.");
    }
  }
};


Blockly.JavaScript['uprog_break'] = function( block ) {
  return 'break;\n';
};

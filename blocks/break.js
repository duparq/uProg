
Blockly.Blocks['uprog_break'] = {
  init: function() {
    this.setColour(Blockly.Blocks.loops.HUE);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    // var x = this.appendDummyInput();
    if ( App.language === 'fr' ) {
      //this.setHelpUrl(Blockly.Msg.CONTROLS_FLOW_STATEMENTS_HELPURL);
      this.appendDummyInput().appendField("SORTIR");
      this.setTooltip("Sort de la boucle.");
    }
    else {
      this.appendDummyInput().appendField("BREAK");
      this.setTooltip("Break out of loop.");
    }
  },
  i18n: function() {}
};


Blockly.JavaScript['uprog_break'] = function( block ) {
  return 'break;\n';
};

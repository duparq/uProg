
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/ublockly
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/*  UBlockly's PROCEDURE block
 */

'use strict';

Blockly.Blocks['uprog_start'] = {
  init: function() {
    if ( App.language === 'fr' )
      this.appendDummyInput().appendField("DÉBUT");
    else
      this.appendDummyInput().appendField("START");
    this.setNextStatement(true, null);
    this.movable = false;
    this.deletable = false;
    this.setTooltip('');
    this.setHelpUrl('http://www.example.com/');
  }
};


Blockly.JavaScript['uprog_start'] = function ( block )
{
  return "";
}

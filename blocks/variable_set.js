
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


Blockly.Blocks['variables_set'] = {
  /**
   * Block for variable setter.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "message0": "%1 %2%3",
      "args0": [
        {
          "type": "field_variable",
          "name": "VAR",
          "variable": "variable"
        },
	{
	  "type": "field_image",
	  "src": "blocks/variable_set.svg",
	  "width": 18,
	  "height": 16,
	  "alt": "<-"
	},
        {
          "type": "input_value",
          "name": "VALUE"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": Blockly.Blocks.variables.HUE
    });
    this.i18n();
  },
  i18n: function() {
    if ( App.language === 'fr' ) {
      this.setTooltip("Change la valeur de la variable.");
      this.contextMenuMsg_ = "Créer un bloc «Valeur de %1»";
    }
    else {
      this.setTooltip("Change the value of the variable.");
      this.contextMenuMsg_ = "Create a bloc «Value of %1»";
    }
  },
  contextMenuType_: 'variables_get',
  customContextMenu: Blockly.Blocks['variables_get'].customContextMenu
};

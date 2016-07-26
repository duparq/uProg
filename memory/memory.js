
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


var memory = {};

memory.keys = [];


//  Initialize UI elements
//
memory.setup = function ( )
{
  this.id = 'memory' ;
  windowSetup( this );
  this.i18n();

  //  '__monitor__' is a wrapper used to update the memory content while the
  //  interpreter is running
  //
  Blockly.JavaScript.addReservedWords('__monitor__');
};


//  Change language
//
memory.i18n = function ( )
{
  if ( App.language === 'fr' ) {
    this.window.name.innerHTML = "Mémoire";
  }
  else {
    this.window.name.innerHTML = "Memory";
  }
};


//  Reload memory content
//
memory.reset = function ( )
{
  var content = memory.window.content ;
  while ( content.firstChild )
    content.removeChild(content.firstChild);

  var variables = Blockly.Variables.allVariables(App.workspace);

  if ( variables.length ) {
    var table = document.createElement('table');
    for ( var i=0 ; i < variables.length ; i++) {
      var tr = document.createElement('tr');

      var key = Blockly.JavaScript.variableDB_.getName( variables[i],
							Blockly.Variables.NAME_TYPE );
      //  Variable name
      //
      var tdn = document.createElement('td');
      tdn.classList.add('name');
      tdn.innerHTML = key ;
      tr.appendChild(tdn);

      //  Variable value
      //
      var tdv = document.createElement('td');
      tdv.classList.add('value');
      tr.appendChild(tdv);

      table.appendChild(tr);

      memory.keys[key]={name:tdn, value:tdv};
    }
  }
  content.appendChild(table);
};

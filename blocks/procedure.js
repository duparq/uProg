
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


/*  Javascript generator
 */
Blockly.JavaScript['procedures_defreturn'] = function(block) {
  //log.dbg('Blockly.JavaScript procedures_defreturn');
  // Define a procedure with a return value.
  var funcName = Blockly.JavaScript.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.JavaScript.statementToCode(block, 'STACK');
  if (Blockly.JavaScript.STATEMENT_PREFIX) {
    branch = Blockly.JavaScript.prefixLines(
        Blockly.JavaScript.STATEMENT_PREFIX.replace(/%1/g,
        '\'' + block.id + '\''), Blockly.JavaScript.INDENT) + branch;
  }
  if (Blockly.JavaScript.INFINITE_LOOP_TRAP) {
    branch = Blockly.JavaScript.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + block.id + '\'') + branch;
  }
  var returnValue = Blockly.JavaScript.valueToCode(block, 'RETURN',
      Blockly.JavaScript.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = '  return ' + returnValue + ';\n';
  }
  var args = [];
  var monitorCode = '';
  for (var x = 0; x < block.arguments_.length; x++) {
    args[x] = Blockly.JavaScript.variableDB_.getName(block.arguments_[x],
						     Blockly.Variables.NAME_TYPE);
    if ( zdebugger.x_generate && zdebugger.hasMonitor(args[x]) ) {
      //log.dbg('procedures_defreturn __monitor__ '+args[x]);
      monitorCode += "__monitor__('"+args[x]+"', "+args[x]+");\n"
    }
  }
  var code = 'function ' + funcName + '(' + args.join(', ') + ') {\n' +
      monitorCode + branch + returnValue + '}';
  code = Blockly.JavaScript.scrub_(block, code);
  Blockly.JavaScript.definitions_[funcName] = code;
  return null;
};


/*  Modify Blockly's precedure's parameters display
 */
Blockly.Blocks['procedures_defnoreturn'].updateParams_ = function() {
  // Check for duplicated arguments.
  var badArg = false;
  var hash = {};
  for (var i = 0; i < this.arguments_.length; i++) {
    if (hash['arg_' + this.arguments_[i].toLowerCase()]) {
      badArg = true;
      break;
    }
    hash['arg_' + this.arguments_[i].toLowerCase()] = true;
  }
  if (badArg) {
    this.setWarningText(Blockly.Msg.PROCEDURES_DEF_DUPLICATE_WARNING);
  } else {
    this.setWarningText(null);
  }
  // Merge the arguments into a human-readable list.
  var paramString = '';
  if (this.arguments_.length) {
    paramString = '( '+ this.arguments_.join(', ')+' )';
  }
  // The params field is deterministic based on the mutation,
  // no need to fire a change event.
  Blockly.Events.disable();
  this.setFieldValue(paramString, 'PARAMS');
  Blockly.Events.enable();
};


/*  Modify Blockly's functions's parameters display
 */
Blockly.Blocks['procedures_defreturn'].updateParams_ =
  Blockly.Blocks['procedures_defnoreturn'].updateParams_ ;

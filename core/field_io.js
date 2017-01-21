
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


/**
 * Class for a io's dropdown field.
 * @param {?string} varname The default name for the io.  If null,
 *     a unique io name will be generated.
 * @param {Function=} opt_validator A function that is executed when a new
 *     option is selected.  Its sole argument is the new option value.
 * @extends {Blockly.FieldDropdown}
 * @constructor
 */
Blockly.FieldIo = function( ioname, rw )
{
  if ( !rw )
    App.log("Blockly.FieldIo: missing rw argument.");
  this.rw = rw ;
  Blockly.FieldIo.superClass_.constructor.call(this, Blockly.FieldIo.dropdownCreate);
  this.setValue(ioname || '');
};

goog.inherits(Blockly.FieldIo, Blockly.FieldDropdown);


/**
 * Install this dropdown on a block.
 */
Blockly.FieldIo.prototype.init = function() {
  //App.log("Blockly.FieldIo.prototype.init");
  if (this.fieldGroup_) {
    // Dropdown has already been initialized once.
    return;
  }
  Blockly.FieldIo.superClass_.init.call(this);
  if (!this.getValue()) {
    this.setValue('i/o');
  }
};


// Blockly.FieldIo.prototype.getValue = function() {
//   //App.log("Blockly.FieldIo.prototype.getValue: -> "+this.getText());
//   return this.getText();
// };

/**
 * Set the io name.
 * @param {string} newValue New text.
 */
Blockly.FieldIo.prototype.setValue = function(newValue)
{
  // App.log("Blockly.FieldIo.prototype.setValue("+newValue+")");
  if (this.sourceBlock_ && Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.Change(
        this.sourceBlock_, 'field', this.name, this.value_, newValue));
  }
  this.value_ = newValue;
  this.setText(newValue);
};

/**
 * Return a sorted list of io names for io dropdown menus.
 * Include a special option at the end for creating a new io name.
 * @return {!Array.<string>} Array of io names.
 * @this {!Blockly.FieldIo}
 */
Blockly.FieldIo.dropdownCreate = function() {
  //App.log("Blockly.FieldIo.dropdownCreate");
  if ( hw.target ) {
    var ioNames = Object.keys(hw.target.ios).sort();
    if (ioNames.indexOf(this.getText()) == -1)
      this.setValue('?');
    var options = [];
    for (var x = 0; x < ioNames.length; x++) {
      options[x] = [ioNames[x], ioNames[x]];
    }
  }
  else
    var options = ['?'];
  return options;
};

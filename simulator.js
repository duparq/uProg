
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/ublockly
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';

var simulator = {};

simulator.interpreter = null;
simulator.x_stepping = false;
simulator.x_showsteps = false;
simulator.x_stop = false ;
simulator.x_pause = false ;
simulator.x_milestone = false ;
simulator.pauseMS = 1 ;


/*  Called when the interpreter encounters a __milestone__ statement
 */
simulator.milestone = function ( id ) {
  //App.log("simulator.milestone("+id+")");
//  simulator.stepId = id ;
  simulator.x_milestone = true ;
  if ( simulator.x_stepping === true || simulator.pauseMS > 0 )
    App.workspace.highlightBlock(id);
};


simulator.initApi = function ( interpreter, scope ) {
  //App.log("simulator.initApi");
  var i = interpreter ;

  // Add an API function for the alert() block.
  var wrapper = function(text) {
    text = text ? text.toString() : '';
    return i.createPrimitive(alert(text));
  };
  i.setProperty(scope, 'alert', i.createNativeFunction(wrapper));

  // Add an API function for the prompt() block.
  var wrapper = function(text) {
    text = text ? text.toString() : '';
    return i.createPrimitive(prompt(text));
  };
  i.setProperty(scope, 'prompt', i.createNativeFunction(wrapper));

  // Add an API function for highlighting blocks.
  var wrapper = function(id) {
    id = id ? id.toString() : '';
    return i.createPrimitive(simulator.milestone(id));
  };
  i.setProperty(scope, '__milestone__', i.createNativeFunction(wrapper));
};


simulator.setupInterpreter = function ( ) {
  App.workspace.traceOn(true);
  // Generate JavaScript code and parse it.
  Blockly.JavaScript.STATEMENT_PREFIX = '__milestone__(%1);\n';
  Blockly.JavaScript.addReservedWords('__milestone__');
  simulator.code = Blockly.JavaScript.workspaceToCode(App.workspace);
  simulator.interpreter = new Interpreter(simulator.code, simulator.initApi);
  //  alert('Ready to execute this code:\n\n' + simulator.code);
  App.log(App.MSG.SIMULATOR_READY);
};


simulator.play = function ( ) {
  if ( simulator.interpreter === null )
    simulator.setupInterpreter();

  App.playIcon.classList.add('disabled');
  App.pauseIcon.classList.remove('disabled');
  App.stopIcon.classList.remove('disabled');
  App.stepIcon.classList.add('disabled');

  App.log(App.MSG.SIMULATOR_STARTED);
  simulator.x_stop = false ;
  simulator.x_showsteps = false ;
  simulator.x_stepping = false;
  simulator.next();
};


simulator.pause = function ( ) {
  simulator.x_stepping = true ;
//  simulator.x_showsteps = true ;
  App.pauseIcon.classList.add('disabled');
  App.stepIcon.classList.remove('disabled');
};


simulator.stop = function ( ) {
  simulator.x_stop = true;
//  App.pauseIcon.classList.add('disabled');
//  App.stepIcon.classList.remove('disabled');
};


simulator.step = function ( ) {
  //App.log("simulator.step");
  App.pauseIcon.classList.add('disabled');
  App.stopIcon.classList.remove('disabled');

  if ( simulator.interpreter === null )
    simulator.setupInterpreter();

  simulator.x_stepping = true;
  simulator.next();
};


/*  Interprete next statement
 */
simulator.next = function ( ) {
  //App.log("simulator.next");
  try {
    var ok = simulator.interpreter.step();
  } finally {
    if (!ok) {
      simulator.interpreter = null ;
    }
  }

  if ( simulator.x_stop ) {
    /*
     *  User wants to abort
     */
    simulator.interpreter = null ;
  }

  if ( simulator.interpreter === null ) {
    /*
     *  End of simulation
     */
    App.log(App.MSG.SIMULATOR_DONE);
    App.workspace.highlightBlock(null);
    App.playIcon.classList.remove('disabled');
    App.pauseIcon.classList.add('disabled');
    App.stopIcon.classList.add('disabled');
    App.stepIcon.classList.remove('disabled');
    return ;
  }

  if ( simulator.x_milestone ) {
    simulator.x_milestone = false ;
    if ( simulator.x_stepping ) {
      /*
       *  Stop execution between milestones if stepping
       */
      return ;
    }
    else if ( simulator.pauseMS > 0 ) {
      window.setTimeout( function(){simulator.next();}, simulator.pauseMS );
      return ;
    }
  }

  simulator.next();
};

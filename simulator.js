
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
simulator.timeoutId = null;
simulator.x_running = false;
simulator.x_showsteps = true;
simulator.x_pause = false ;
simulator.x_milestone = false ;

simulator.speeds = [ 0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000 ];
simulator.speed = 8 ; // Integer required
simulator.pauseMS = simulator.speeds[simulator.speed];


/*  Mouse moved the input range
 */
simulator.oninput = function ( e ) {
  simulator.speed = e.target.value;
  simulator.speedChanged();
};

simulator.onwheel = function ( e ) {
  //App.log('OnWheel dx:'+e.deltaX+' dy:'+e.deltaY+' dz:'+e.deltaZ);
  if ( e.deltaY < 0 && simulator.speed > 0 )
    simulator.speed-- ;
  else if ( e.deltaY > 0 && simulator.speed < simulator.speeds.length-1 )
    simulator.speed++ ;
  App.speedRange.value = simulator.speed;
  simulator.speedChanged();
};

simulator.speedChanged = function ( ) {
  //App.log('simulator.speedChanged '+simulator.speed);
  simulator.pauseMS = simulator.speeds[simulator.speed];
  if ( simulator.speed == 0 ) {
    App.workspace.highlightBlock(null);
    simulator.x_showsteps = false;
  }
  else
    simulator.x_showsteps = true;
};


/*  Called when the interpreter encounters a __milestone__ statement
 */
simulator.milestone = function ( id ) {
  //App.log("simulator.milestone("+id+")");
  simulator.x_milestone = true ;
  if ( simulator.x_showsteps )
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
  // App.workspace.readOnly = true ; // No effect
  // Generate JavaScript code and parse it.
  Blockly.JavaScript.STATEMENT_PREFIX = '__milestone__(%1);\n';
  Blockly.JavaScript.addReservedWords('__milestone__');
  simulator.code = Blockly.JavaScript.workspaceToCode(App.workspace);
  simulator.interpreter = new Interpreter(simulator.code, simulator.initApi);
  //  alert('Ready to execute this code:\n\n' + simulator.code);
  App.log(App.MSG.SIMULATOR_READY);
};


simulator.play = function ( ) {
  if ( App.playIcon.classList.contains('disabled') )
    return ;

  if ( simulator.x_running )
    return ;

  if ( simulator.interpreter === null )
    simulator.setupInterpreter();

  App.playIcon.classList.add('disabled');
  App.pauseIcon.classList.remove('disabled');
  App.stopIcon.classList.remove('disabled');
  App.stepIcon.classList.add('disabled');

  App.log(App.MSG.SIMULATOR_STARTED+' ('+simulator.pauseMS+' ms)');
  simulator.x_running = true ;
  simulator.next();
};


simulator.pause = function ( ) {
  if ( App.pauseIcon.classList.contains('disabled') )
    return ;

  window.clearTimeout(simulator.timeoutId);
  simulator.timeoutId = null ;
  simulator.x_running = false ;
  App.playIcon.classList.remove('disabled');
  App.pauseIcon.classList.add('disabled');
  App.stepIcon.classList.remove('disabled');
};


simulator.stop = function ( ) {
  if ( App.stopIcon.classList.contains('disabled') )
    return ;

  window.clearTimeout(simulator.timeoutId);
  simulator.interpreter = null ;
  simulator.x_running = false ;
  App.workspace.highlightBlock(null);
  App.playIcon.classList.remove('disabled');
  App.pauseIcon.classList.add('disabled');
  App.stopIcon.classList.remove('disabled');
  App.stepIcon.classList.remove('disabled');
  App.log(App.MSG.SIMULATOR_DONE);
};


simulator.step = function ( ) {
  //App.log("simulator.step");
  if ( App.stepIcon.classList.contains('disabled') )
    return ;

  if ( simulator.interpreter === null )
    simulator.setupInterpreter();

  App.stopIcon.classList.remove('disabled');
  simulator.x_running = false;
  simulator.next();
};


/*  Interprete next statement
 */
simulator.next = function ( ) {
  //App.log("simulator.next");
  if ( simulator.interpreter ) {
    try {
      var ok = simulator.interpreter.step();
    } finally {
      if (!ok)
	simulator.interpreter = null ;
    }
  }

  if ( simulator.interpreter === null ) {
    /*
     *  End of simulation
     */
    App.log(App.MSG.SIMULATOR_DONE);
    App.workspace.highlightBlock(null);
    // App.workspace.readOnly = false ; // No effect
    App.playIcon.classList.remove('disabled');
    App.pauseIcon.classList.add('disabled');
    App.stopIcon.classList.add('disabled');
    App.stepIcon.classList.remove('disabled');
    simulator.x_running = false;
    return ;
  }

  if ( simulator.x_milestone ) {
    simulator.x_milestone = false ;
    if ( !simulator.x_running )
      return ;
    else {
      simulator.timeoutId = window.setTimeout( function(){simulator.next();}, simulator.pauseMS );
      return ;
    }
  }

  /*  Run at maximal speed between milestones
   */
  simulator.next();
};

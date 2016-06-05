
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


/*  Initialize UI elements
 */
simulator.setup = function ( ) {
  simulator.window = document.getElementById('simulatorWindow');
  simulator.windowBar = document.getElementById('simulatorWindowBar');
  simulator.windowBar.onmousedown = simulator.onTargetDivMouseDown ;
  simulator.windowBar.onmouseup = simulator.onTargetDivMouseUp ;

  simulator.playIcon = document.getElementById("simulatorPlayIcon");
  simulator.playIcon.onclick = simulator.play;
  simulator.pauseIcon = document.getElementById("simulatorPauseIcon");
  simulator.pauseIcon.onclick = simulator.pause;
  simulator.stopIcon = document.getElementById("simulatorStopIcon");
  simulator.stopIcon.onclick = simulator.stop;
  simulator.stepIcon = document.getElementById("simulatorStepIcon");
  simulator.stepIcon.onclick = simulator.step;
  simulator.speedRange = document.getElementById("simulatorSpeedRange");
  simulator.speedRange.oninput = simulator.oninput ;
  simulator.speedRange.addEventListener("wheel", simulator.onwheel);
  simulator.speedRange.value = simulator.speed ;
  simulator.speedSpan = document.getElementById("simulatorSpeedSpan");

  document.getElementById('simulatorQuit').onclick = simulator.quit;
  simulator.speedChanged();
}


/*  Simulator window
 */
simulator.show = function ( ) {

  simulator.playIcon.classList.remove('disabled');
  simulator.pauseIcon.classList.add('disabled');
  simulator.stopIcon.classList.add('disabled');
  simulator.stepIcon.classList.remove('disabled');

  simulator.window.parentElement.style.display = "block";

  var x0 = parseInt(window.getComputedStyle(simulator.window).left);
  var y0 = parseInt(window.getComputedStyle(simulator.window).top);
  if ( x0==0 && y0==0 ) {
    var bw = parseInt(window.getComputedStyle(document.body).width);
    var bh = parseInt(window.getComputedStyle(document.body).height);
    var ww = parseInt(window.getComputedStyle(simulator.window).width);
    var wh = parseInt(window.getComputedStyle(simulator.window).height);
    simulator.window.style.left = (bw-ww)/2+'px';
    simulator.window.style.top = (bh-wh)/2+'px';
  }
}

simulator.quit = function ( ) {
  simulator.stop();
  simulator.window.parentElement.style.display = "none";
}

simulator.onTargetDivMouseDown = function ( e ) {
  //App.log('App.onTargetDivMouseDown');
  e.preventDefault();
  simulator.windowBar.setCapture();
  var ex0 = e.clientX ;
  var ey0 = e.clientY ;
  var x0 = parseInt(window.getComputedStyle(simulator.window).left);
  var y0 = parseInt(window.getComputedStyle(simulator.window).top);

  simulator.windowBar.onmousemove = function ( e ) {
    //App.log('simulator.window.onmousemove');
    var ex = e.clientX ;
    var ey = e.clientY ;
    var x = x0 + ex - ex0 ;
    var y = y0 + ey - ey0 ;

    /*  Keep the window's bar visible as it is the only way to exit the modal
     *  mode!
     */
    var bw = parseInt(window.getComputedStyle(document.body).width);
    var bh = parseInt(window.getComputedStyle(document.body).height);
    var ww = parseInt(window.getComputedStyle(simulator.window).width);
    var wh = parseInt(window.getComputedStyle(simulator.window).height);
    var wbh = parseInt(window.getComputedStyle(simulator.windowBar).height);
    if ( x+ww < 20 )
      x = 20-ww ;
    else if ( x > bw-20 )
      x = bw-20 ;
    if ( y < 0 )
      y = 0 ;
    else if ( y > bh-wbh )
      y = bh-wbh ;

    simulator.window.style.left = x+'px';
    simulator.window.style.top = y+'px';
    e.preventDefault();
  }
};

simulator.onTargetDivMouseUp = function ( e ) {
  //App.log("App.onTargetMouseUp");
  e.preventDefault();
  //  document.getElementById(container).style.cursor='default';
  simulator.windowBar.onmousemove = null ;
  simulator.windowBar.releaseCapture();
};


/*  Speed input range
 */
simulator.oninput = function ( e ) {
  e.preventDefault();
  simulator.speed = e.target.value;
  simulator.speedChanged();
};

simulator.onwheel = function ( e ) {
  e.preventDefault();
  //App.log('OnWheel dx:'+e.deltaX+' dy:'+e.deltaY+' dz:'+e.deltaZ);
  if ( e.deltaY < 0 && simulator.speed > 0 )
    simulator.speed-- ;
  else if ( e.deltaY > 0 && simulator.speed < simulator.speeds.length-1 )
    simulator.speed++ ;
  simulator.speedRange.value = simulator.speed;
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
  simulator.speedSpan.innerHTML = simulator.pauseMS+' ms';
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
  //App.log(App.MSG.SIMULATOR_READY);
};


simulator.play = function ( ) {
  if ( simulator.playIcon.classList.contains('disabled') )
    return ;

  if ( simulator.x_running )
    return ;

  if ( simulator.interpreter === null )
    simulator.setupInterpreter();

  simulator.playIcon.classList.add('disabled');
  simulator.pauseIcon.classList.remove('disabled');
  simulator.stopIcon.classList.remove('disabled');
  simulator.stepIcon.classList.add('disabled');

  //App.log(App.MSG.SIMULATOR_STARTED+' ('+simulator.pauseMS+' ms)');
  simulator.x_running = true ;
  simulator.next();
};


simulator.pause = function ( ) {
  if ( simulator.pauseIcon.classList.contains('disabled') )
    return ;

  window.clearTimeout(simulator.timeoutId);
  simulator.timeoutId = null ;
  simulator.x_running = false ;
  simulator.playIcon.classList.remove('disabled');
  simulator.pauseIcon.classList.add('disabled');
  simulator.stepIcon.classList.remove('disabled');
};


simulator.stop = function ( ) {
  if ( simulator.stopIcon.classList.contains('disabled') )
    return ;

  window.clearTimeout(simulator.timeoutId);
  simulator.interpreter = null ;
  simulator.x_running = false ;
  App.workspace.highlightBlock(null);
  simulator.playIcon.classList.remove('disabled');
  simulator.pauseIcon.classList.add('disabled');
  simulator.stopIcon.classList.remove('disabled');
  simulator.stepIcon.classList.remove('disabled');
  //App.log(App.MSG.SIMULATOR_DONE);
};


simulator.step = function ( ) {
  //App.log("simulator.step");
  if ( simulator.stepIcon.classList.contains('disabled') )
    return ;

  if ( simulator.interpreter === null )
    simulator.setupInterpreter();

  simulator.stopIcon.classList.remove('disabled');
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
    //App.log(App.MSG.SIMULATOR_DONE);
    App.workspace.highlightBlock(null);
    // App.workspace.readOnly = false ; // No effect
    simulator.playIcon.classList.remove('disabled');
    simulator.pauseIcon.classList.add('disabled');
    simulator.stopIcon.classList.add('disabled');
    simulator.stepIcon.classList.remove('disabled');
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

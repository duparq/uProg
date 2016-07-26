
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


var cpu = {};

//cpu.x_open = false;
cpu.x_running = false;
cpu.x_showsteps = true;
cpu.x_pause = false ;
cpu.x_milestone = false ;
cpu.x_generate = false ;
//cpu.x_resetMonitors = false ;
cpu.interpreter = null;
cpu.timeoutId = null;

cpu.speeds = [ 0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000 ];
cpu.speed = 8 ; // Integer required!
cpu.pauseMS = cpu.speeds[cpu.speed];
cpu.wrapped_pause = 0 ;


/*  Initialize UI elements
 */
cpu.setup = function ( )
{
  this.id = 'cpu' ;
  windowSetup( this );
  this.i18n();

  cpu.playIcon = document.getElementById("cpuPlayIcon");
  cpu.playIcon.onclick = cpu.play;
  cpu.pauseIcon = document.getElementById("cpuPauseIcon");
  cpu.pauseIcon.onclick = cpu.pause;
  cpu.stopIcon = document.getElementById("cpuStopIcon");
  cpu.stopIcon.onclick = cpu.stop;
  cpu.stepIcon = document.getElementById("cpuStepIcon");
  cpu.stepIcon.onclick = cpu.step;
  cpu.speedRange = document.getElementById("cpuSpeedRange");
  cpu.speedRange.oninput = cpu.oninput ;
  cpu.speedRange.addEventListener("wheel", cpu.onwheel);
  cpu.speedRange.value = cpu.speed ;
  cpu.speedSpan = document.getElementById("cpuSpeedSpan");
//  cpu.variablesDiv = document.getElementById("cpuMonitors");

  cpu.speedChanged();

  /*  Reserved words
   */
  Blockly.JavaScript.addReservedWords('__block__,__monitor__,__pause__');
};


//  Change language
//
cpu.i18n = function ( )
{
  if ( App.language === 'fr' ) {
    this.window.name.innerHTML = "Processeur";
  }
  else {
    this.window.name.innerHTML = "Processor";
  }
};


//  Handle speed input range
//
cpu.oninput = function ( e )
{
  e.preventDefault();
  cpu.speed = e.target.value;
  cpu.speedChanged();
};

cpu.onwheel = function ( e )
{
  e.preventDefault();
  //App.log('OnWheel dx:'+e.deltaX+' dy:'+e.deltaY+' dz:'+e.deltaZ);
  if ( e.deltaY < 0 && cpu.speed > 0 )
    cpu.speed-- ;
  else if ( e.deltaY > 0 && cpu.speed < cpu.speeds.length-1 )
    cpu.speed++ ;
  cpu.speedRange.value = cpu.speed;
  cpu.speedChanged();
};

cpu.speedChanged = function ( )
{
  cpu.pauseMS = cpu.speeds[cpu.speed];
  if ( cpu.speed == 0 ) {
    App.workspace.highlightBlock(null);
    cpu.x_showsteps = false;
  }
  else
    cpu.x_showsteps = true;
  cpu.speedSpan.innerHTML = cpu.pauseMS+' ms';
};


//  Handle show/hide window content
//
cpu.onDisplay = function ( )
{
//  App.log("cpu.onDisplay");

  if ( cpu.window.content.classList.contains('visible') ) {
    cpu.x_open = true ;
    cpu.playIcon.classList.remove('disabled');
    cpu.pauseIcon.classList.add('disabled');
    cpu.stopIcon.classList.add('disabled');
    cpu.stepIcon.classList.remove('disabled');

    //    cpu.updateMonitors();
    cpu.reset();
  }
  else {
    if ( App.workspace ) {
      App.workspace.highlightBlock(null);
      cpu.interpreter = null ;
      // cpu.window.style.display = "none";
//      cpu.x_open = false ;
    }
  }
};


/*  Re-generate code, create a new interpreter, and highlight the first block.
 */
cpu.reset = function ( )
{
//  App.log("cpu.reset");
  // if ( !cpu.x_open )
  //   return;

  // if ( !cpu.window.content.classList.contains('visible') )
  //   return ;

  cpu.playIcon.style.display = "block";
  cpu.pauseIcon.style.display = "none";
  
  cpu.x_generate = true ;
  Blockly.JavaScript.STATEMENT_PREFIX = '__block__(%1);\n';
  cpu.code = Blockly.JavaScript.workspaceToCode(App.workspace);

  cpu.interpreter = new Interpreter(cpu.code, cpu.initApi);
  App.workspace.traceOn(true);
  cpu.next();
//  cpu.x_resetMonitors = true ;
};


cpu.play = function ( )
{
  cpu.playIcon.style.display = "none";
  cpu.pauseIcon.style.display = "block";

  cpu.playIcon.classList.add('disabled');
  cpu.pauseIcon.classList.remove('disabled');
  cpu.stopIcon.classList.remove('disabled');
  cpu.stepIcon.classList.add('disabled');

  //App.log(App.MSG.DEBUGGER_STARTED+' ('+cpu.pauseMS+' ms)');
  cpu.x_running = true ;
  cpu.next();
};


cpu.pause = function ( )
{
  window.clearTimeout(cpu.timeoutId);
  cpu.timeoutId = null ;
  cpu.x_running = false ;
  cpu.playIcon.classList.remove('disabled');
  cpu.pauseIcon.classList.add('disabled');
  cpu.stepIcon.classList.remove('disabled');

  cpu.playIcon.style.display = "block";
  cpu.pauseIcon.style.display = "none";
};


cpu.stop = function ( )
{
  if ( cpu.stopIcon.classList.contains('disabled') )
    return ;

  window.clearTimeout(cpu.timeoutId);
  cpu.interpreter = null ;
  cpu.x_running = false ;
  App.workspace.highlightBlock(null);
  cpu.playIcon.classList.remove('disabled');
  cpu.pauseIcon.classList.add('disabled');
  cpu.stopIcon.classList.remove('disabled');
  cpu.stepIcon.classList.remove('disabled');
  //App.log(App.MSG.DEBUGGER_DONE);
  //cpu.variables = {};

  cpu.reset();
};


cpu.step = function ( )
{
  //App.log("cpu.step");
  if ( cpu.stepIcon.classList.contains('disabled') )
    return ;

  cpu.stopIcon.classList.remove('disabled');
  cpu.x_running = false;
  cpu.next();
};


/*  Interprete next statement
 */
cpu.next = function ( )
{

  // if ( cpu.x_resetMonitors ) {
  //   cpu.x_resetMonitors = false ;
  //   for( var key in cpu.monitors ) {
  //     cpu.monitors[key].value = undefined;
  //     cpu.monitors[key].span.innerHTML = 'undefined';
  //   }
  // }

  //App.log("cpu.next");
  if ( cpu.interpreter ) {
    try {
      var ok = cpu.interpreter.step();
    } finally {
      if (!ok)
	cpu.interpreter = null ;
    }
  }

  if ( cpu.interpreter === null ) {
    /*
     *  Execution completed
     */
    //App.log(App.MSG.DEBUGGER_DONE);
    App.workspace.highlightBlock(null);
    // App.workspace.readOnly = false ; // No effect
    cpu.playIcon.classList.remove('disabled');
    cpu.pauseIcon.classList.add('disabled');
    cpu.stopIcon.classList.add('disabled');
    cpu.stepIcon.classList.remove('disabled');
    cpu.x_running = false;
    cpu.reset();
    return ;
  }

  if ( cpu.x_running && cpu.wrapped_pause ) {
//    console.log("manage pause");
    cpu.timeoutId = window.setTimeout( function(){cpu.next();},
					     cpu.wrapped_pause );
    cpu.wrapped_pause = 0 ;
    return ;
  }

  if ( cpu.x_milestone ) {
    cpu.x_milestone = false ;
    if ( !cpu.x_running )
      return ;
    cpu.timeoutId = window.setTimeout( function(){cpu.next();},
					     cpu.pauseMS );
    return ;
  }

  /*  Run at maximal speed between milestones
   */
  cpu.next();
};






//  Interpreter setup
//
cpu.initApi = function ( interpreter, scope )
{
  //App.log("cpu.initApi");
  var i = interpreter ;

  // Wrapper for highlighting blocks.
  //
  var wrapper = function(id) {
    id = id ? id.toString() : '';
    return i.createPrimitive(cpu.milestone(id));
  };
  i.setProperty(scope, '__block__', i.createNativeFunction(wrapper));

  //  Wrapper for setting a value
  //
  if ( memory.window.content.classList.contains('visible') )
    i.setProperty( scope, '__monitor__',
  		   i.createNativeFunction( function(key,value) {
  		     memory.keys[key].value.innerHTML=value;
  		   }));

  // Wrapper for 'pause'
  //
  wrapper = function(n,u){ return i.createPrimitive( cpu.wrapper_pause(n,u) ); };
  i.setProperty( scope, '__pause__', i.createNativeFunction( wrapper ));
};


//  Called when the interpreter encounters a __block__ statement
//
cpu.milestone = function ( id )
{
  //App.log("cpu.milestone("+id+")");

//  console.log("cpu.milestone");
  cpu.x_milestone = true ;
  if ( cpu.x_showsteps )
    App.workspace.highlightBlock(id);
};


//  Called when the interpreter encounters a __pause__ statement
//
cpu.wrapper_pause = function( n, u )
{
  var ms = parseInt(n);
  if ( u == "s" )
    ms = ms * 1000 ;
  else if ( u == "us" || u == "cy" )
    ms = ms / 1000 ;
  if ( ms >= 1 ) {
//    console.log("Pause("+n+","+u+"): "+ms+" ms.");
    cpu.wrapped_pause = ms ;
  }
};

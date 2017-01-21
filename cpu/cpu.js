
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


/*  Initialize UI elements
 */
cpu.setup = function ( )
{
  cpu.x_run = false;
  cpu.x_generate = false ;
  cpu.interpreter = null;
  cpu.timeoutId = null;
  cpu.milestone_id = null ;

  cpu.speeds = [ 0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000 ];
  cpu.speed = 8 ; // Integer required!
  cpu.stepDelay = cpu.speeds[cpu.speed];
  cpu.wrapped_pause = 0 ;

  // App.log("cpu.setup");
  this.id = 'cpu' ;
  windowSetup( this );

  cpu.resetBtn = document.getElementById("cpuResetBtn");
  cpu.resetBtn.onclick = cpu.reset;
  cpu.playBtn = document.getElementById("cpuPlayBtn");
  cpu.playBtn.onclick = cpu.play;
  cpu.pauseBtn = document.getElementById("cpuPauseBtn");
  cpu.pauseBtn.onclick = cpu.pause;
  cpu.stepBtn = document.getElementById("cpuStepBtn");
  cpu.stepBtn.onclick = cpu.run;
  cpu.speedDiv = document.getElementById("cpuSpeed");
  cpu.speedRange = document.getElementById("cpuSpeedRange");
  cpu.speedRange.oninput = cpu.oninput ;
  cpu.speedRange.addEventListener("wheel", cpu.onwheel);
  cpu.speedRange.value = cpu.speed ;
  cpu.speedSpan = document.getElementById("cpuSpeedSpan");

  cpu.speedChanged();

  /*  Reserved words
   */
  Blockly.JavaScript.addReservedWords('__block__,__monitor__,__pause__,__hw_write_io__');
};


//  Load/Save session info
//
cpu.saveSession = function ( storage )
{
  // App.log("cpu.saveSession");
  windowSaveSession( storage, cpu.window,
		     {'speed': cpu.speed});
}

cpu.restoreSession = function ( storage )
{
  // App.log("cpu.restoreSession");
  var dic = windowRestoreSession( storage, cpu.window );
  // App.log("  "+dic.speed);
  if ( dic.speed >= 0 && dic.speed < cpu.speeds.length ) {
    cpu.speed = dic.speed ;
    cpu.speedRange.value = cpu.speed;
    cpu.speedChanged();
  }
  else
    cpu.speed = 8;
}


//  Change language
//
cpu.i18n = function ( )
{
  if ( App.language === 'fr' ) {
    cpu.window.name.innerHTML = "Processeur";
    cpu.resetBtn.title = "Réinitialise le processeur." ;
    cpu.playBtn.title = "Exécute la suite du programme." ;
    cpu.pauseBtn.title = "Suspend l'exécution." ;
    cpu.stepBtn.title = "Exécute seulement l'instruction surlignée." ;
    cpu.speedDiv.title = "Délai minimum entre deux instructions.";
  }
  else {
    cpu.window.name.innerHTML = "Processor";
    cpu.resetBtn.title = "Reset the processor." ;
    cpu.playBtn.title = "Run the program." ;
    cpu.pauseBtn.title = "Suspend execution." ;
    cpu.stepBtn.title = "Execute only the highlighted instruction." ;
    cpu.speedDiv.title = "Minimal delay between two instructions.";
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
  if ( e.deltaY > 0 && cpu.speed > 0 )
    cpu.speed-- ;
  else if ( e.deltaY < 0 && cpu.speed < cpu.speeds.length-1 )
    cpu.speed++ ;
  cpu.speedRange.value = cpu.speed;
  cpu.speedChanged();
};


cpu.speedChanged = function ( )
{
  // App.log("cpu.speedChanged");
  cpu.stepDelay = cpu.speeds[cpu.speed];
  // App.log("  "+cpu.stepDelay);
  cpu.speedSpan.innerHTML = cpu.stepDelay+' ms';
  App.sessionIsDirty = true ;
};


//  Handle show/hide window content
//
cpu.onDisplay = function ( )
{
  if ( cpu.window.content.classList.contains('visible') ) {
    cpu.x_open = true ;
    cpu.reset();
  }
  else {
    if ( App.workspace ) {
      // App.workspace.highlightBlock(null);
      cpu.interpreter = null ;
    }
  }
};


/*  Re-generate code, create a new interpreter, and highlight the first block.
 */
cpu.reset = function ( )
{
  cpu.milestone_id = null;
  window.clearTimeout(cpu.timeoutId);
  cpu.x_run = false ;
  // App.workspace.highlightBlock(null);
  //  App.workspace.traceOn(true);

  cpu.playBtn.style.display = "block";
  cpu.playBtn.classList.remove('disabled');
  cpu.playBtn.onclick = cpu.play;
  cpu.pauseBtn.style.display = "none";
  cpu.stepBtn.classList.remove('disabled');
  cpu.stepBtn.onclick = cpu.run;

  if ( memory )
    memory.reset();

  cpu.x_generate = true ;
  Blockly.JavaScript.STATEMENT_PREFIX = '__block__(%1);\n';
  cpu.code = Blockly.JavaScript.workspaceToCode(App.workspace);
  cpu.x_generate = false ;
  if ( cpu.code ) {
    cpu.interpreter = new Interpreter(cpu.code, cpu.initWrappers);
    // App.workspace.highlightBlock(null);
    App.workspace.traceOn(true);
    cpu.run();
  }
};


cpu.play = function ( )
{
  cpu.playBtn.style.display = "none";
  cpu.pauseBtn.style.display = "block";
  cpu.pauseBtn.onclick = cpu.pause;
  cpu.stepBtn.classList.add('disabled');
  cpu.stepBtn.onclick = null;

  App.workspace.highlightBlock(null);
//  App.workspace.traceOn(false);
  cpu.x_run = true ;
  cpu.run();
};


cpu.pause = function ( )
{
  App.workspace.traceOn(true);
  window.clearTimeout(cpu.timeoutId);
  cpu.timeoutId = 0 ;
  cpu.x_run = false ;
  cpu.playBtn.style.display = "block";
  cpu.pauseBtn.style.display = "none";
  cpu.stepBtn.classList.remove('disabled');
  cpu.stepBtn.onclick = cpu.run;
};


/*  Interprete next statement
 */
cpu.run = function ( )
{
  // App.log("cpu.run");
  while ( true ) {
    // App.log("  step");
    try {
      var ok = cpu.interpreter.step();
    }
    finally {
      if (!ok)
	break ;
    }

    //  Run at maximum speed until next milestone
    //
    if ( cpu.milestone_id == 0 )
      continue ;

    if ( cpu.x_run == false ) {
      App.workspace.highlightBlock( cpu.milestone_id );
      cpu.milestone_id = 0 ;
      return ;
    }

    var delay = cpu.speeds[cpu.speed];
    if ( cpu.wrapped_pause ) {
      if ( cpu.wrapped_pause > delay ) {
	delay = cpu.wrapped_pause ;
      }
      cpu.wrapped_pause = 0 ;
    }

    if ( delay != 0 ) {
      if ( cpu.speed != 0 ) {
	App.workspace.highlightBlock( cpu.milestone_id );
	cpu.milestone_id = 0 ;
      }
      cpu.timeoutId = window.setTimeout( cpu.run, delay );
      return;
    }

    cpu.milestone_id = 0 ;
  }

  //  Execution completed
  //
  App.workspace.highlightBlock(null);
  App.workspace.traceOn(false);
  // App.workspace.readOnly = false ; // No effect
  cpu.playBtn.style.display = "block";
  cpu.playBtn.classList.add('disabled');
  cpu.playBtn.onclick = null;
  cpu.pauseBtn.style.display = "none";
  cpu.stepBtn.classList.add('disabled');
  cpu.stepBtn.onclick = null;
  cpu.x_run = false ;
  return ;
};


//  Interpreter setup
//
cpu.initWrappers = function ( interpreter, scope )
{
  var i = interpreter ;

  // Wrapper for highlighting blocks.
  //
  var wrapper = function(id) {
    id = id ? id.toString() : '';
    return i.createPrimitive( cpu.milestone_id = id );
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

  // Wrapper '__hw_write_io__'
  //
  wrapper = function(io,v){ return i.createPrimitive( hw.write_io(io,v) ); };
  i.setProperty( scope, '__hw_write_io__', i.createNativeFunction( wrapper ));

  // Wrapper '__hw_read_io__'
  //
  wrapper = function(io){ return i.createPrimitive( hw.read_io(io) ); };
  i.setProperty( scope, '__hw_read_io__', i.createNativeFunction( wrapper ));
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
    cpu.wrapped_pause = ms ;
  }
};

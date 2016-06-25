
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


/*  Debugger
 */
var zdebugger = {};

zdebugger.x_open = false;
zdebugger.x_running = false;
zdebugger.x_showsteps = true;
zdebugger.x_pause = false ;
zdebugger.x_milestone = false ;
zdebugger.x_generate = false ;
zdebugger.x_resetMonitors = false ;
zdebugger.interpreter = null;
zdebugger.monitors = [];
zdebugger.timeoutId = null;

zdebugger.speeds = [ 0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000 ];
zdebugger.speed = 8 ; // Integer required!
zdebugger.pauseMS = zdebugger.speeds[zdebugger.speed];


/*  Replace original Javascript generator's variable getter/setter with these
 *  ones that provide wrappers for variable monitoring when the zdebugger asks
 *  for code generation.
 */
// Blockly.JavaScript['variables_get'] = function ( block )
// {
//   var key1 = block.getFieldValue('VAR');
//   var key2 = Blockly.JavaScript.variableDB_.getName(key1, Blockly.Variables.NAME_TYPE);
//   if ( zdebugger.x_generate && zdebugger.monitors.hasOwnProperty(key1) )
//     var code = "__get__('"+key1+"')";
//   else
//     var code = key2;

//   return [code, Blockly.JavaScript.ORDER_ATOMIC];
// };

Blockly.JavaScript['variables_set'] = function ( block )
{
  var key1 = block.getFieldValue('VAR');
  var key2 = Blockly.JavaScript.variableDB_.getName(key1, Blockly.Variables.NAME_TYPE);
  var value = Blockly.JavaScript.valueToCode(
    block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';

  var code = key2+'='+value+';\n';
  if ( zdebugger.x_generate && zdebugger.monitors.hasOwnProperty(key1) )
    code += "__monitor__('"+key1+"', "+key2+");\n";

  return code;
};

/*  Initialize UI elements
 */
zdebugger.setup = function ( ) {
  zdebugger.window = document.getElementById('zdebuggerWindow');
  zdebugger.windowBar = document.getElementById('zdebuggerWindowBar');
  zdebugger.windowBar.onmousedown = zdebugger.onTargetDivMouseDown ;
  zdebugger.windowBar.onmouseup = zdebugger.onTargetDivMouseUp ;
  zdebugger.windowName = document.getElementById('zdebuggerWindowName');
  zdebugger.windowClose = document.getElementById('zdebuggerWindowClose');
  zdebugger.windowClose.onclick = zdebugger.quit;

  zdebugger.playIcon = document.getElementById("zdebuggerPlayIcon");
  zdebugger.playIcon.onclick = zdebugger.play;
  zdebugger.pauseIcon = document.getElementById("zdebuggerPauseIcon");
  zdebugger.pauseIcon.onclick = zdebugger.pause;
  zdebugger.stopIcon = document.getElementById("zdebuggerStopIcon");
  zdebugger.stopIcon.onclick = zdebugger.stop;
  zdebugger.stepIcon = document.getElementById("zdebuggerStepIcon");
  zdebugger.stepIcon.onclick = zdebugger.step;
  zdebugger.speedRange = document.getElementById("zdebuggerSpeedRange");
  zdebugger.speedRange.oninput = zdebugger.oninput ;
  zdebugger.speedRange.addEventListener("wheel", zdebugger.onwheel);
  zdebugger.speedRange.value = zdebugger.speed ;
  zdebugger.speedSpan = document.getElementById("zdebuggerSpeedSpan");
  zdebugger.variablesDiv = document.getElementById("zdebuggerMonitors");

  // document.getElementById('zdebuggerQuit').onclick = zdebugger.quit;
  zdebugger.speedChanged();

  /*  Reserved words
   */
  Blockly.JavaScript.addReservedWords('__block__,__get__,__monitor__');
};


/*  True if key is monitored
 */
zdebugger.hasMonitor = function ( key )
{
  var r = zdebugger.monitors.hasOwnProperty(key);
  //log.dbg('zdebugger.hasMonitor '+key+' '+r);
  return r ;
};


/*  Add/remove a monitor
 */
zdebugger.toggleMonitor = function ( key )
{
  if ( zdebugger.monitors.hasOwnProperty(key) ) {
    //log.dbg("Monitor delete "+key);
    delete zdebugger.monitors[key];
  }
  else {
    //log.dbg("Monitor add "+key);
    zdebugger.monitors[key]=[];
  }
  zdebugger.updateMonitors();
  zdebugger.reset();
};


zdebugger.renameMonitor = function ( key1, key2 )
{
  //log.dbg('zdebugger.renameMonitor: '+key1+' '+key2);
  var monitor = zdebugger.monitors[key1];
  if ( monitor ) {
    zdebugger.monitors[key2] = monitor ;
    delete zdebugger.monitors[key1];
    zdebugger.updateMonitors();
    zdebugger.reset();
  }
//  log.dbg('  '+m1);
};


/*  Put monitored variables in the monitoring area
 */
zdebugger.updateMonitors = function ( )
{
  while ( zdebugger.variablesDiv.firstChild )
    zdebugger.variablesDiv.removeChild(zdebugger.variablesDiv.firstChild);

  for( var key in zdebugger.monitors ) {
    //log.dbg(' var: '+key);
    var label = document.createElement('label');

    var btn = document.createElement('img');
    btn.src="icons/delete.svg"
    btn.name = key ;
    btn.onclick = function ( e ) { zdebugger.toggleMonitor(e.target.name); }
    label.appendChild(btn);

    label.appendChild(document.createTextNode(key));
    zdebugger.variablesDiv.appendChild(label);
    var span = document.createElement('span');
    span.class = 'value';
    span.innerHTML = 'undefined';
    label.appendChild(span);
    zdebugger.monitors[key].value = undefined;
    zdebugger.monitors[key].span = span;
  }
};


/*  Debugger window
 */
zdebugger.show = function ( )
{
  if ( zdebugger.window.style.display === "block" ) {
    zdebugger.quit();
    return;
  }

  zdebugger.x_open = true ;
  zdebugger.playIcon.classList.remove('disabled');
  zdebugger.pauseIcon.classList.add('disabled');
  zdebugger.stopIcon.classList.add('disabled');
  zdebugger.stepIcon.classList.remove('disabled');

  // zdebugger.window.parentElement.style.display = "block";
  zdebugger.window.style.display = "block";

  var x0 = parseInt(window.getComputedStyle(zdebugger.window).left);
  var y0 = parseInt(window.getComputedStyle(zdebugger.window).top);
  if ( x0==0 && y0==0 ) {
    var bw = parseInt(window.getComputedStyle(document.body).width);
    var bh = parseInt(window.getComputedStyle(document.body).height);
    var ww = parseInt(window.getComputedStyle(zdebugger.window).width);
    var wh = parseInt(window.getComputedStyle(zdebugger.window).height);
    zdebugger.window.style.left = (bw-ww)/2+'px';
    zdebugger.window.style.top = (bh-wh)/2+'px';
  }
  zdebugger.updateMonitors();
  zdebugger.reset();
};


zdebugger.quit = function ( )
{
  App.workspace.highlightBlock(null);
  zdebugger.interpreter = null ;
//  zdebugger.window.parentElement.style.display = "none";
  zdebugger.window.style.display = "none";
  zdebugger.x_open = false ;
};


zdebugger.onTargetDivMouseDown = function ( e )
{
  //App.log('App.onTargetDivMouseDown');
  e.preventDefault();
  //  zdebugger.windowBar.setCapture();
  App.setCapture(zdebugger.windowBar);
  var ex0 = e.clientX ;
  var ey0 = e.clientY ;
  var x0 = parseInt(window.getComputedStyle(zdebugger.window).left);
  var y0 = parseInt(window.getComputedStyle(zdebugger.window).top);

  zdebugger.windowBar.onmousemove = function ( e ) {
    //App.log('zdebugger.window.onmousemove');
    var ex = e.clientX ;
    var ey = e.clientY ;
    var x = x0 + ex - ex0 ;
    var y = y0 + ey - ey0 ;

    /*  Keep the window's bar visible as it is the only way to exit the modal
     *  mode!
     */
    var bw = parseInt(window.getComputedStyle(document.body).width);
    var bh = parseInt(window.getComputedStyle(document.body).height);
    var ww = parseInt(window.getComputedStyle(zdebugger.window).width);
    var wh = parseInt(window.getComputedStyle(zdebugger.window).height);
    var wbh = parseInt(window.getComputedStyle(zdebugger.windowBar).height);
    if ( x+ww < 20 )
      x = 20-ww ;
    else if ( x > bw-20 )
      x = bw-20 ;
    if ( y < 0 )
      y = 0 ;
    else if ( y > bh-wbh )
      y = bh-wbh ;

    zdebugger.window.style.left = x+'px';
    zdebugger.window.style.top = y+'px';
    e.preventDefault();
  }
};


zdebugger.onTargetDivMouseUp = function ( e )
{
  //App.log("App.onTargetMouseUp");
  e.preventDefault();
  //  document.getElementById(container).style.cursor='default';
  zdebugger.windowBar.onmousemove = null ;
  //zdebugger.windowBar.releaseCapture();
  App.setCapture(null);
};


/*  Speed input range
 */
zdebugger.oninput = function ( e ) {
  e.preventDefault();
  zdebugger.speed = e.target.value;
  zdebugger.speedChanged();
};

zdebugger.onwheel = function ( e ) {
  e.preventDefault();
  //App.log('OnWheel dx:'+e.deltaX+' dy:'+e.deltaY+' dz:'+e.deltaZ);
  if ( e.deltaY < 0 && zdebugger.speed > 0 )
    zdebugger.speed-- ;
  else if ( e.deltaY > 0 && zdebugger.speed < zdebugger.speeds.length-1 )
    zdebugger.speed++ ;
  zdebugger.speedRange.value = zdebugger.speed;
  zdebugger.speedChanged();
};

zdebugger.speedChanged = function ( ) {
  //App.log('zdebugger.speedChanged '+zdebugger.speed);
  zdebugger.pauseMS = zdebugger.speeds[zdebugger.speed];
  if ( zdebugger.speed == 0 ) {
    App.workspace.highlightBlock(null);
    zdebugger.x_showsteps = false;
  }
  else
    zdebugger.x_showsteps = true;
  zdebugger.speedSpan.innerHTML = zdebugger.pauseMS+' ms';
};


/*  Called when the interpreter encounters a __block__ statement
 */
zdebugger.milestone = function ( id ) {
  //App.log("zdebugger.milestone("+id+")");
  zdebugger.x_milestone = true ;
  if ( zdebugger.x_showsteps )
    App.workspace.highlightBlock(id);
};


zdebugger.initApi = function ( interpreter, scope ) {

  //App.log("zdebugger.initApi");
  var i = interpreter ;

  // Add an API function for highlighting blocks.
  var wrapper = function(id) {
    id = id ? id.toString() : '';
    return i.createPrimitive(zdebugger.milestone(id));
  };
  i.setProperty(scope, '__block__', i.createNativeFunction(wrapper));

  /*  Variable wrapper: get variable value
   */
  // i.setProperty(
  //   scope,
  //   '__get__',
  //   i.createNativeFunction( function(key) {
  //     var value = zdebugger.monitors[key].value;
  //     //log.sim("__get__('"+key+"') -> "+value);
  //     return value;
  //   }));

  /*  Variable wrapper: set variable value
   */
  i.setProperty(
    scope,
    '__monitor__',
    i.createNativeFunction( function(key,value) {
      //App.log("__monitor__('"+key+"', "+value+")");
      //log.sim(key+" = "+value);
      //zdebugger.monitors[key].value=value;
      zdebugger.monitors[key].span.innerHTML=value;
    }));
};


/*  Re-generate code, create a new interpreter, and highlight the first block.
 */
zdebugger.reset = function ( )
{
  if ( !zdebugger.x_open )
    return;

  zdebugger.playIcon.style.display = "block";
  zdebugger.pauseIcon.style.display = "none";
  
  // App.workspace.readOnly = true ; // No effect
  zdebugger.x_generate = true ;
  Blockly.JavaScript.STATEMENT_PREFIX = '__block__(%1);\n';
  zdebugger.code = Blockly.JavaScript.workspaceToCode(App.workspace);
//  Blockly.JavaScript.STATEMENT_PREFIX = null;
//  zdebugger.x_generate = false ;

  zdebugger.interpreter = new Interpreter(zdebugger.code, zdebugger.initApi);
  App.workspace.traceOn(true);
  zdebugger.next();
  zdebugger.x_resetMonitors = true ;
};


zdebugger.play = function ( )
{
  zdebugger.playIcon.style.display = "none";
  zdebugger.pauseIcon.style.display = "block";

  zdebugger.playIcon.classList.add('disabled');
  zdebugger.pauseIcon.classList.remove('disabled');
  zdebugger.stopIcon.classList.remove('disabled');
  zdebugger.stepIcon.classList.add('disabled');

  //App.log(App.MSG.DEBUGGER_STARTED+' ('+zdebugger.pauseMS+' ms)');
  zdebugger.x_running = true ;
  zdebugger.next();
};


zdebugger.pause = function ( ) {
  window.clearTimeout(zdebugger.timeoutId);
  zdebugger.timeoutId = null ;
  zdebugger.x_running = false ;
  zdebugger.playIcon.classList.remove('disabled');
  zdebugger.pauseIcon.classList.add('disabled');
  zdebugger.stepIcon.classList.remove('disabled');

  zdebugger.playIcon.style.display = "block";
  zdebugger.pauseIcon.style.display = "none";
};


zdebugger.stop = function ( ) {
  if ( zdebugger.stopIcon.classList.contains('disabled') )
    return ;

  window.clearTimeout(zdebugger.timeoutId);
  zdebugger.interpreter = null ;
  zdebugger.x_running = false ;
  App.workspace.highlightBlock(null);
  zdebugger.playIcon.classList.remove('disabled');
  zdebugger.pauseIcon.classList.add('disabled');
  zdebugger.stopIcon.classList.remove('disabled');
  zdebugger.stepIcon.classList.remove('disabled');
  //App.log(App.MSG.DEBUGGER_DONE);
  //zdebugger.variables = {};

  zdebugger.reset();
};


zdebugger.step = function ( ) {
  //App.log("zdebugger.step");
  if ( zdebugger.stepIcon.classList.contains('disabled') )
    return ;

  zdebugger.stopIcon.classList.remove('disabled');
  zdebugger.x_running = false;
  zdebugger.next();
};


/*  Interprete next statement
 */
zdebugger.next = function ( ) {

  if ( zdebugger.x_resetMonitors ) {
    zdebugger.x_resetMonitors = false ;
    for( var key in zdebugger.monitors ) {
      zdebugger.monitors[key].value = undefined;
      zdebugger.monitors[key].span.innerHTML = 'undefined';
    }
  }

  //App.log("zdebugger.next");
  if ( zdebugger.interpreter ) {
    try {
      var ok = zdebugger.interpreter.step();
    } finally {
      if (!ok)
	zdebugger.interpreter = null ;
    }
  }

  if ( zdebugger.interpreter === null ) {
    /*
     *  Execution completed
     */
    //App.log(App.MSG.DEBUGGER_DONE);
    App.workspace.highlightBlock(null);
    // App.workspace.readOnly = false ; // No effect
    zdebugger.playIcon.classList.remove('disabled');
    zdebugger.pauseIcon.classList.add('disabled');
    zdebugger.stopIcon.classList.add('disabled');
    zdebugger.stepIcon.classList.remove('disabled');
    zdebugger.x_running = false;
    zdebugger.reset();
    return ;
  }

  if ( zdebugger.x_milestone ) {
    zdebugger.x_milestone = false ;
    if ( !zdebugger.x_running )
      return ;
    else {
      zdebugger.timeoutId = window.setTimeout( function(){zdebugger.next();}, zdebugger.pauseMS );
      return ;
    }
  }

  /*  Run at maximal speed between milestones
   */
  zdebugger.next();
};

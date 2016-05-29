
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

/**
 * Create a namespace for the application.
 */
var App = {};


App.console = document.getElementById('console');

var icon_console = document.getElementById("icon-console");


/*  Display and log messages
 */
App.log = function(msg) {
  console.log(msg);
  var c = document.getElementById("console");
  var x_scroll = c.scrollHeight - c.clientHeight <= c.scrollTop + 1;

  c.innerHTML = c.innerHTML.concat(msg+"\r\n");

  if (x_scroll)
    c.scrollTop = c.scrollHeight - c.clientHeight;
};


/*  Show/hide the console
 */
if ( icon_console ) {
  icon_console.onclick = function() {
    var d = window.getComputedStyle(App.console).display ;
    if ( d === "none" ) {
      vsplitter.style.display="block";
      App.console.style.display="block";
    }
    else {
      vsplitter.style.display="none";
      App.console.style.display="none";
    }
    App.resize();
  };
}



vsplitter.onmousedown = function(e) {

  var prev = document.getElementById('blocklyDiv');
  var next = document.getElementById('console');

  var y0 = e.clientY ;
  var ph0 = parseInt(window.getComputedStyle(prev).height, 10);
  var nh0 = parseInt(window.getComputedStyle(next).height, 10);

  //log("Body height: "+document.body.offsetHeight);
  //log("Vsplitter mouse down: "+y0+" "+ph0+" "+nh0);

  vsplitter.setCapture();
  e.preventDefault();

  vsplitter.onmousemove = function(e) {
    var dy = y0 - e.clientY ;
    var pmh = parseInt(window.getComputedStyle(prev).minHeight,10) ;
    var nmh = parseInt(window.getComputedStyle(next).minHeight,10) ;

    /*  Set elements heights
     */
    if ( (pmh != pmh || ph0-dy >= pmh) &&
	 (nmh != nmh || nh0+dy >= nmh) ) {
      prev.style.height = ph0-dy+'px' ;
      next.style.height = nh0+dy+'px' ;

      /*  Have the Blockly workspace resized
       */
      App.resize();
    }
    e.preventDefault();
  }
};

vsplitter.onmouseup = function(e) {
  vsplitter.releaseCapture();
  vsplitter.onmousemove = null;
  e.preventDefault();
};


App.resize = function() {
  if ( App.workspace ) {
    //log("Resize");

    var h = document.body.clientHeight - blocklyDiv.offsetTop ;
    if ( window.getComputedStyle(App.console).display !== "none" ) {
      h -= parseInt(window.getComputedStyle(vsplitter).height, 10);
      h -= parseInt(window.getComputedStyle(App.console).height, 10);
    }

    blocklyDiv.style.height = h+'px' ;

    //  Blockly.asyncSvgResize(workspace); // Found in blockly/inject.js
    Blockly.svgResize(App.workspace);
  }
}


App.init = function() {

  App.workspace = null ;
  App.dirty = false ;
  App.blocklyDiv = document.getElementById('blocklyDiv');
  App.vsplitter = document.getElementById('vsplitter');

  l10n.init();

  // App.workspace = Blockly.inject('blocklyDiv',
  // 				 {toolbox: document.getElementById('toolbox'),
  // 				  zoom:
  // 				  {controls: false,
  // 				   wheel: true,
  // 				   startScale: 1.0,
  // 				   maxScale: 3,
  // 				   minScale: 0.3,
  // 				   scaleSpeed: 1.2},
  // 				  grid:
  // 				  {spacing: 20,
  // 				   length: 1,
  // 				   colour: '#aaf',
  // 				   snap: true},
  // 				  trashcan: false });

  // App.workspace.addChangeListener( function() {
  //   var icon = icon_trash || null ;
  //   if ( icon ) {
  //     var nblocks = App.workspace.getAllBlocks().length;
  //     if ( nblocks > 0 ) {
  // 	icon.style.opacity = "1.0";
  // 	icon.onclick = onTrash ;
  //     }
  //     else {
  // 	icon.style.opacity = "0.2";
  // 	icon.onclick = null ;
  //     }
  //   }
  //   App.dirty = true;
  // });


  window.addEventListener('resize', App.resize, false);
  App.resize();
}


App.createWorkspace = function() {
};


window.addEventListener('load', App.init);

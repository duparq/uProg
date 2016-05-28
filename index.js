
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

//log("Started");

var blocklyDiv = document.getElementById('blocklyDiv');
var vsplitter = document.getElementById('vsplitter');

var workspace = Blockly.inject('blocklyDiv',
			       {toolbox: document.getElementById('toolbox'),
				zoom:
				{controls: false,
				 wheel: true,
				 startScale: 1.0,
				 maxScale: 3,
				 minScale: 0.3,
				 scaleSpeed: 1.2},
				grid:
				{spacing: 20,
				 length: 1,
				 colour: '#aaf',
				 snap: true},
				trashcan: false });


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
      resize();
    }
    e.preventDefault();
  }
};

vsplitter.onmouseup = function(e) {
  vsplitter.releaseCapture();
  vsplitter.onmousemove = null;
  e.preventDefault();
};


function resize ( ) {
  //log("Resize");

  var h = document.body.clientHeight - blocklyDiv.offsetTop ;
  if ( window.getComputedStyle(cons).display !== "none" ) {
    h -= parseInt(window.getComputedStyle(vsplitter).height, 10);
    h -= parseInt(window.getComputedStyle(cons).height, 10);
  }

  blocklyDiv.style.height = h+'px' ;

  Blockly.asyncSvgResize(workspace); // Found in blockly/inject.js
}

window.addEventListener('resize', resize, false);
resize();

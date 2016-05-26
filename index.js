
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/ublockly
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/*  Install the blockly workspace
 */

'use strict';


/*  Namespace
 */
var BLY = {};
BLY.translations = {};


var blocklyArea = document.getElementById('blocklyArea');
var blocklyDiv = document.getElementById('blocklyDiv');

// var workspace = Blockly.inject(blocklyDiv,
// 			       {media: '../../media/',
// 				toolbox: document.getElementById('toolbox')});

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

/*  Handle blockly area resizes
 */
function resize ( ) {
  
  var e = blocklyArea;
  var x = 2;
  var y = 2;
  do {
    x += e.offsetLeft;
    y += e.offsetTop;
    e = e.offsetParent;
  } while (e);

  x += blocklyArea.style.borderLeftWidth;
  y += blocklyArea.style.borderTopWidth;
  var w = blocklyArea.clientWidth;
  var h = blocklyArea.clientHeight - 4 ;
  log("  Blockly area: "+x+" "+y+" "+w+"x"+h);

  // Position blocklyDiv over blocklyArea.
  //
  if ( blocklyDiv ) {
    blocklyDiv.style.left = x + 'px';
    blocklyDiv.style.top = y + 'px';
    blocklyDiv.style.width = w + 'px';
    blocklyDiv.style.height = h + 'px';
  }
}

new ResizeSensor(blocklyArea, resize);
window.addEventListener('resize', onresize, false);

resize();

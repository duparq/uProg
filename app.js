
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

var App = {};

App.MSG = {};

App.generatedCode = '' ;


/*  Display and log messages
 */
App.log = function(msg) {
  console.log(msg);
  var c = App.consoleDiv;
  var x_scroll = c.scrollHeight - c.clientHeight <= c.scrollTop + 1;

  c.innerHTML = c.innerHTML.concat(msg+"\r\n");

  if (x_scroll)
    c.scrollTop = c.scrollHeight - c.clientHeight;
};


/*  Show/hide the code div
 */
function codeIcon_onclick ( )
{
  var d = window.getComputedStyle(App.codeDiv).display ;
  if ( d === "none" ) {
    App.codeSplitter.style.display="block";
    App.codeDiv.style.display="block";
  }
  else {
    App.codeSplitter.style.display="none";
    App.codeDiv.style.display="none";
  }
  App.layout();
}


/*  Code splitter
 */
function codeSplitter_onmousedown ( e )
{
  var prev = App.blocklyDiv;
  var next = App.codeDiv;

  var v0 = e.clientX ;
  var pv0 = parseInt(window.getComputedStyle(prev).width, 10);
  var nv0 = parseInt(window.getComputedStyle(next).width, 10);

  // App.codeSplitter.setCapture();
  // e.preventDefault();
  App.setCapture( App.codeSplitter );

  App.codeSplitter.onmousemove = function(e) {
    /*
     *  Resize elements
     */
    var dv = v0 - e.clientX ;
    var pmv = parseInt(window.getComputedStyle(prev).minWidth,10) ;
    var nmv = parseInt(window.getComputedStyle(next).minWidth,10) ;

    if ( (pmv != pmv || pv0-dv >= pmv) &&
	 (nmv != nmv || nv0+dv >= nmv) ) {
      prev.style.width = pv0-dv+'px' ;
      next.style.width = nv0+dv+'px' ;

      /*  Have the Blockly workspace resized
       */
      App.layout();
    }
    // e.preventDefault();
  }
};

function codeSplitter_onmouseup ( e ) {
  // App.codeSplitter.releaseCapture();
  App.codeSplitter.onmousemove = null;
  // e.preventDefault();
  App.setCapture( null );
};


/*  Show/hide the console
 */
function consoleIcon_onclick ( ) {
  var d = window.getComputedStyle(App.consoleDiv).display ;
  if ( d === "none" ) {
    App.consoleSplitter.style.display="block";
    App.consoleDiv.style.display="block";
  }
  else {
    App.consoleSplitter.style.display="none";
    App.consoleDiv.style.display="none";
  }
  App.layout();
}

function consoleSplitter_onmousedown ( e )
{
  //var prev = App.blocklyDiv;
  var prev = App.codeArea;
  var next = App.consoleDiv;

  var y0 = e.clientY ;
  var ph0 = parseInt(window.getComputedStyle(prev).height, 10);
  var nh0 = parseInt(window.getComputedStyle(next).height, 10);

  // App.consoleSplitter.setCapture();
  // e.preventDefault();
  App.setCapture( App.consoleSplitter );

  App.consoleSplitter.onmousemove = function(e) {
    var dy = y0 - e.clientY ;
    var pmh = parseInt(window.getComputedStyle(prev).minHeight,10) ;
    var nmh = parseInt(window.getComputedStyle(next).minHeight,10) ;

    if ( (pmh != pmh || ph0-dy >= pmh) &&
	 (nmh != nmh || nh0+dy >= nmh) ) {
      prev.style.height = ph0-dy+'px' ;
      next.style.height = nh0+dy+'px' ;

      App.layout();
    }
    // e.preventDefault();
  }
};


function consoleSplitter_onmouseup ( e )
{
  App.setCapture( null );
  // App.consoleSplitter.releaseCapture();
  App.consoleSplitter.onmousemove = null;
  // e.preventDefault();
};


App.layout = function() {
  if ( App.workspace ) {
    //log("Layout");

    var w = document.body.clientWidth - blocklyDiv.offsetLeft ;
    if ( window.getComputedStyle(App.codeDiv).display !== "none" ) {
      w -= parseInt(window.getComputedStyle(App.codeSplitter).width, 10);
      w -= parseInt(window.getComputedStyle(App.codeDiv).width, 10);
    }
    w += 8 ;
    blocklyDiv.style.width = w+'px' ;

    var h = document.body.clientHeight - blocklyDiv.offsetTop ;
    if ( window.getComputedStyle(App.consoleDiv).display !== "none" ) {
      h -= parseInt(window.getComputedStyle(App.consoleSplitter).height, 10);
      h -= parseInt(window.getComputedStyle(App.consoleDiv).height, 10);
    }
    else
      h += 6 ;
    blocklyDiv.style.height = h+'px' ;

    Blockly.svgResize(App.workspace);
  }
}


App.setup = function() {
  /* Lookup for names of supported languages.  Keys should be in ISO 639 format.
   */
  var LANGNAMES = {
    'en': 'English',
    'fr': 'Français',
  };

  App.language = navigator.language;

  /*  Sort languages alphabetically.
   */
  var languages = [];
  for (var l in LANGNAMES) {
    languages.push([LANGNAMES[l], l]);
  }
  var comp = function(a, b) {
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
  };
  languages.sort(comp);
  App.languages = languages;

  /*  Populate the language selector and select the current value
   */
  App.langMenu = document.getElementById('language');
  App.langMenu.options.length = 0;
  for (var i = 0; i < languages.length; i++) {
    var tuple = languages[i];
    var value = tuple[tuple.length - 1];
    var option = new Option(tuple[0], value);
    if (value === App.language) { option.selected = true; }
    App.langMenu.options.add(option);
  }

  App.langMenu.onchange = App.changeLanguage ;
  App.changeLanguage(); // Apply default translation
};


/*  Set up UI language change
 *    Load UI translation script according to the selected option
 *    Apply the translation
 */
App.changeLanguage = function() {
  App.language = App.languages[App.langMenu.selectedIndex][1];
  App.script  = document.createElement("script");
  App.script.src  = "msg/"+App.language+".js";
  App.script.type = "text/javascript";
  document.body.appendChild(App.script);
};


/*  Replace the workspace for translation.
 *    NOTE: this is called by the application-loaded translation script.
 */
App.translateBlockly = function() {
  //  App.log("translateBlockly");


  /*  Translate UBlockly's blocks
   */
  Blockly.Msg.PROCEDURES_BEFORE_PARAMS = ", selon :";
  Blockly.Msg.PROCEDURES_CALL_BEFORE_PARAMS = ", selon :";
  Blockly.Msg.PROCEDURES_CREATE_DO = "Créer un bloc «%1»";

  /*  Save the blocks and the undo/redo stacks
   */
  var dom = null ;
  // var undostack ;
  // var redostack ;
  if ( App.workspace !== null ) {
    dom = Blockly.Xml.workspaceToDom(App.workspace);
    // undostack = App.workspace.undoStack_;
    // redostack = App.workspace.redoStack_;
    // App.log("workspace.undoStack_ = "+undostack);
  }

  /*  Remove existing toolboxes
   */
  var tbs = document.body.getElementsByClassName('blocklyToolboxDiv');
  for ( var i=0, tb ; tb=tbs[i] ; i++ )
    document.body.removeChild(tb);

  /*  Flush the blocklyDiv
   */
  var e = document.getElementById('blocklyDiv');
  while (e.lastChild)
    e.removeChild(e.lastChild);

  /*  Remove existing Blockly translations
   */
  delete Blockly.Msg.fr;
  delete Blockly.Msg.en;

  /*  Inject a new workspace
   */
  var options = {
    toolbox: document.getElementById('toolbox'),
    zoom: {
      controls: false,
      wheel: true,
      startScale: 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2},
    grid: {
      spacing: 20,
      length: 20,
      colour: '#eef',
      snap: true},
    trashcan: false
  };
  App.workspace = Blockly.inject('blocklyDiv', options);

  App.workspace.addChangeListener( App.onChange );

  /*  Restore original blocks and undo/redo stacks
   */
  if ( dom !== null ) {
    Blockly.Xml.domToWorkspace( dom, App.workspace );
    // App.workspace.undoStack_ = undostack;
    // App.workspace.redoStack_ = redostack;
  }

  App.layout();

  document.body.removeChild(App.script);
};


/*  Process workspace's 'change' events to update the generated code. 'move'
 *  events must be processed as they can be fired because of blocs being
 *  attached or detached. So, we use a timeout to lower the code regeneration
 *  rate.
 */
App.onChange = function ( e ) {
  //App.log('App.onChange('+e.type+')');

  if ( e.type !== Blockly.Events.UI )
    App.dirty = true ;

  if ( e.type === Blockly.Events.CREATE ||
       e.type === Blockly.Events.DELETE ||
       e.type === Blockly.Events.MOVE ||
       e.type === Blockly.Events.CHANGE ) {

    if ( App.moveTimeoutId != null )
      window.clearTimeout(App.moveTimeoutId);
    if ( codeDiv.style.display !== 'none' )
      App.moveTimeoutId = window.setTimeout(App.codeChanged,250);
  }
};


/*  Regenerate target code
 */
App.codeChanged = function ( ) {
  //App.log('App.change');

  var nblocks = App.workspace.getAllBlocks().length;
  if ( nblocks > 0 ) {
    App.trashIcon.classList.remove('disabled');
    App.trashIcon.onclick = onTrash ;
  }
  else {
    App.trashIcon.classList.add('disabled');
    App.trashIcon.onclick = null ;
  }

  /*  Generate target code from the blocks.
   */
//  Blockly.JavaScript.STATEMENT_PREFIX = null;
  var code = Blockly.JavaScript.workspaceToCode(App.workspace);

  if ( App.generatedCode !== code ) {
    App.generatedCode = code ;
    /*
     *  Generated code changed, need to update window and reset the debugger
     */
    /*  Prettify if possible
     */
    if (typeof prettyPrintOne == 'function') {
      code = prettyPrintOne(code, 'js');
      App.codeDiv.innerHTML = code;
    }
    else
      App.codeDiv.textContent = code;
    zdebugger.reset();
  }
};


// /**
//  * Load the Prettify CSS and JavaScript.
//  */
// App.importPrettify = function() {
//   var link = document.createElement('link');
//   link.setAttribute('rel', 'stylesheet');
//   link.setAttribute('href', '../prettify.css');
//   document.head.appendChild(link);
//   var script = document.createElement('script');
//   script.setAttribute('src', '../prettify.js');
//   document.head.appendChild(script);
// };


function onTrash ( )
{
  var nblocks = App.workspace.getAllBlocks().length;
  if ( nblocks ) {
    if ( App.dirty == false )
      App.workspace.clear();
    else {
      var modal = document.getElementById('modal');
      modal.onclick = function(e) {
	modal.style.display = "none";
	dialog.style.display = "none";
      }
      var dialog = document.getElementById('modal-discard-confirm');
      var yes = dialog.getElementsByClassName('yes')[0];
      yes.onclick = function() {
	App.workspace.clear();
      }
      modal.style.display = "block";
      dialog.style.display = "block";
    }
  }
}


App.textToWorkspace = function ( text )
{
  var dom = null;
  try { dom = Blockly.Xml.textToDom( text ); } catch (e) {}
  if ( dom ) {
    try {
      Blockly.Xml.domToWorkspace(dom, App.workspace);
    } catch (e) { dom = null; }
  }
  if ( dom === null ) {
    alert('Invalid XML');
    App.log('The XML file was not successfully parsed into blocks.' +
	    'Please review the XML code and try again.');
  }
  return dom;
};


/*  Set mouse capture management (Chrome does not implement setCapture)
 */
App.setupCapture = function ( )
{
  App.captureTarget = null ;

  var mousemove = function ( e ) {
    if ( App.captureTarget !== null ) {
      //log.dbg('mousemove');
      e.preventDefault();
      e.stopPropagation();
      App.captureTarget.onmousemove(e);
    }
  };

  var mouseup = function ( e ) {
    if ( App.captureTarget !== null ) {
      //log.dbg('mouseup');
      e.preventDefault();
      e.stopPropagation();
      App.captureTarget.onmouseup(e);
    }
  };

  document.addEventListener('mousemove', mousemove );
  document.addEventListener('mouseup', mouseup );
}


App.setCapture = function ( target )
{
  App.captureTarget = target ;
}


/*    M a i n
 */
App.init = function()
{
  Blockly.HSV_SATURATION = 0.4 ; //0.45 ;
  Blockly.HSV_VALUE = 0.7 ; //0.65 ;

  App.workspace = null ;
  App.dirty = false ;

  App.codeArea = document.getElementById('codeArea');
  App.blocklyDiv = document.getElementById('blocklyDiv');
  App.trashIcon = document.getElementById('trashIcon');
  App.modalDiscardConfirm = document.getElementById('modal-discard-confirm');

  App.fileUploadIcon = document.getElementById("icon-file-upload");
  App.fileDownloadIcon = document.getElementById("icon-file-download");

  App.codeIcon = document.getElementById("codeIcon");
  App.codeIcon.onclick = codeIcon_onclick ;
  App.codeSplitter = document.getElementById('codeSplitter');
  App.codeSplitter.onmousedown = codeSplitter_onmousedown ;
  App.codeSplitter.onmouseup = codeSplitter_onmouseup ;
  App.codeDiv = document.getElementById('codeDiv');

  App.consoleIcon = document.getElementById("consoleIcon");
  App.consoleIcon.onclick = consoleIcon_onclick ;
  App.consoleSplitter = document.getElementById('consoleSplitter');
  App.consoleSplitter.onmousedown = consoleSplitter_onmousedown ;
  App.consoleSplitter.onmouseup = consoleSplitter_onmouseup ;
  App.consoleDiv = document.getElementById("consoleDiv");

  App.zdebuggerIcon = document.getElementById("zdebuggerIcon");
  App.zdebuggerIcon.onclick = zdebugger.show ;

  window.addEventListener('resize', App.layout, false);
  App.layout();

  zdebugger.setup();
  file.init();

  App.setupCapture();

  App.setup();
}


window.addEventListener('load', App.init);

window.setTimeout(
  function() { App.textToWorkspace(
    '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="procedures_defnoreturn" id="i%D5TY649Qc`-(/NJB)c" x="530" y="110"><field name="NAME">faire</field><comment pinned="false" h="80" w="160">Décrire cette procédure…</comment><statement name="STACK"><block type="variables_set" id="x.]T+Efnq:i6Q%GdbR,6"><field name="VAR">compte</field><value name="VALUE"><block type="math_number" id="sz-8*vM_YZaL2sC?Z`}!"><field name="NUM">0</field></block></value><next><block type="controls_whileUntil" id="aD1C.?A;ghnxq3*.v|dC"><field name="MODE">WHILE</field><value name="BOOL"><block type="logic_compare" id="6du)-fmgoYSS/6sz,^mp"><field name="OP">NEQ</field><value name="A"><block type="variables_get" id="es/:#cC?C1E:[mPZ82Y*"><field name="VAR">compte</field></block></value><value name="B"><block type="math_number" id="r.QNpbbF7.UKOP-l2,8d"><field name="NUM">10</field></block></value></block></value><statement name="DO"><block type="variables_set" id=",KAWumeQRl6i8ZuDm|1C"><field name="VAR">compte</field><value name="VALUE"><block type="math_arithmetic" id="hJ;Aedg{k}5_hf51mf`l"><field name="OP">ADD</field><value name="A"><shadow type="math_number" id=",PN`r@V+ann9N5u@|]^o"><field name="NUM">1</field></shadow><block type="variables_get" id="V#VI^.,I-_ndduu(k:t+"><field name="VAR">compte</field></block></value><value name="B"><shadow type="math_number" id="Q6UOiB6,yF1(I]DWwHKf"><field name="NUM">1</field></shadow></value></block></value></block></statement></block></next></block></statement></block><block type="procedures_callnoreturn" id=".L[Z%B6qdIYwO7*44W}3" x="530" y="310"><mutation name="faire"></mutation></block></xml>'); }, 500 );


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
  App.i18n();
};


App.i18n = function ( )
{
  if ( App.language === 'fr' ) {
    document.getElementById("icon-file-upload").title = "Charge des blocs depuis un fichier.";
    document.getElementById("icon-file-download").title = "Télécharge le fichier de ces blocs.";
  }
  else {
    document.getElementById("icon-file-upload").title = "Upload a file to add blocks.";
    document.getElementById("icon-file-download").title = "Download.";
  }

  cpu.i18n();
  memory.i18n();
  hw.i18n();
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


  /*  Translate uProg's blocks
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

  if ( e.type !== Blockly.Events.UI ) {
    App.mustSave = true ;
  }
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
    cpu.reset();
    memory.reset();
  }
};


function onTrash ( )
{
  var nblocks = App.workspace.getAllBlocks().length;
  if ( nblocks ) {
    if ( App.mustSave == false )
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


App.onWsOpen = function ( )
{
  // App.log("onWsOpen")
  document.getElementById("icon-file-upload").style.display = "none" ;
  document.getElementById("icon-file-download").style.display = "none" ;
  App.ws.send("SERIALS");
}


App.onWsClose = function ( )
{
  window.clearTimeout( App.wsTimeoutId );
  // App.log("WS Closed.")
  App.wsTimeoutId = window.setTimeout( App.wsConnect, 2000 );
  document.getElementById("icon-file-upload").style.display = "inline" ;
  document.getElementById("icon-file-download").style.display = "inline" ;
}


App.wsTimeout = function ( )
{
  // console.log("WS Timeout.")
  //  if ( App.ws.readyState != CONNECTING && App.ws.readyState != OPEN ) {
  if ( App.ws.readyState > 1 ) {
    App.ws.close();
  }
}


App.onWsMessage = function ( s )
{
  App.log("onWsMessage: "+s)
}


App.wsConnect = function ( )
{
  var ip = "127.0.0.1"
  var port = "39000"

  App.ws = new WebSocket("ws:"+ip+":"+port);
  App.ws.onopen = App.onWsOpen ;
  App.ws.onclose = App.onWsClose ;
  App.ws.onmessage = App.onWsMessage ;

  App.wsTimeoutId = {} ;
  App.wsTimeoutId = window.setTimeout( App.wsTimeout, 1000 );
}


App.timeout = function ( e ) {
  if ( App.sessionIsDirty ) {
    App.saveSession();
    App.sessionIsDirty = false ;
  }
  window.clearTimeout(App.timeoutId);
  App.timeoutId = window.setTimeout(App.timeout,1000);
}


//  File loader: loads an XML file from the users file system and adds the
//  blocks into the Blockly workspace.
//
App.onFileUpload = function ( )
{
  //  Handle file input dialog
  //
  var onFileInput = function(e) {
    var reader = new FileReader();
    reader.onload = function() {
      App.log("file_upload()");
      if ( App.textToWorkspace(reader.result) ) {
	document.title = file.name ;
	App.dirty = false ;
      }
    };

    file = e.target.files[0];
    App.log("file name="+file.name);
    reader.readAsText(file);
  };

  //  Create one invisible browse button with event listener, and click it
  //
  var fileinput = document.getElementById('file-input');
  if (fileinput == null) {
    var fileinputDom = document.createElement('INPUT');
    fileinputDom.type = 'file';
    fileinputDom.id = 'file-input';

    var fileinputWrapperDom = document.createElement('DIV');
    fileinputWrapperDom.id = 'file-input-wrapper';
    fileinputWrapperDom.style.display = 'none';
    fileinputWrapperDom.appendChild(fileinputDom);

    document.body.appendChild(fileinputWrapperDom);
    fileinput = document.getElementById('file-input');
    fileinput.addEventListener('change', onFileInput, false);
  }
  fileinput.click();
};


App.onFileDownload = function ( )
{
  var xmldom = Blockly.Xml.workspaceToDom(App.workspace);
  var xmltext = Blockly.Xml.domToPrettyText(xmldom);
  var blob = new Blob([xmltext], {type: 'text/plain;charset=utf-8'});
  saveAs(blob, file.name);

  //  There is no way to know if the user actually saved the file or
  //  cancelled. Assume he did save.
  //
  App.dirty = false ;
};



//  Save the session configuration in the local storage
//
App.saveSession = function() {
  if( window.localStorage ) {
    var xmldom = Blockly.Xml.workspaceToDom(App.workspace);
    var xmltext = Blockly.Xml.domToPrettyText(xmldom);
    window.localStorage.document = xmltext ;
    cpu.saveSession( window.localStorage );
    memory.saveSession( window.localStorage );
    hw.saveSession( window.localStorage );
  }
  else {
    App.log("No local storage");
  }
}


//  Restore the session previously saved in the local storage
//
App.restoreSession = function() {
  if( window.localStorage ) {
    if( 'document' in window.localStorage ) {
      var s = localStorage.getItem('document');
      App.textToWorkspace( s );
      cpu.restoreSession( window.localStorage );
      memory.restoreSession( window.localStorage );
      hw.restoreSession( window.localStorage );
    }
    else {
      App.log("No session backup found.");
    }
  }
  else {
    App.log("No local storage for session backup.");
  }
}


/*    M a i n
 */
App.init = function()
{
  Blockly.HSV_SATURATION = 0.4 ; //0.45 ;
  Blockly.HSV_VALUE = 0.7 ; //0.65 ;

  /*  Reserved words for Javascript generation
   */
  Blockly.JavaScript.addReservedWords('__block__,__monitor__,__pause__');

  App.workspace = null ;
  App.sessionIsDirty = false ;
  App.mustSave = false ;
  App.timeoutId = window.setTimeout(App.timeout,1000);

  App.codeArea = document.getElementById('codeArea');
  App.blocklyDiv = document.getElementById('blocklyDiv');
  App.trashIcon = document.getElementById('trashIcon');
  App.modalDiscardConfirm = document.getElementById('modal-discard-confirm');

  // App.fileUploadIcon = document.getElementById("icon-file-upload").onclick = App.onFileUpload ;
  document.getElementById("icon-file-upload").onclick = App.onFileUpload ;
  // App.fileDownloadIcon = document.getElementById("icon-file-download");
  document.getElementById("icon-file-download").onclick = App.onFileDownload ;

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

  zdebugger.setup();	//  CPU window
  cpu.setup();		//  CPU window
  memory.setup();	//  Memory window
  hw.setup();		//  Hardware window

  App.setupCapture();

  if( ! window.localStorage ) {
    App.log("WARNING: no local storage available for automatic backup.");
  }
   
  App.setup();
//  App.wsConnect();

  window.setTimeout( App.restoreSession, 500 );
}


window.addEventListener('load', App.init);

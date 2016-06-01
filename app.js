
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

/*  Create a namespace for the application.
 */
var App = {};


/*  Translations
 */
var _ = {};


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

  App.codeSplitter.setCapture();
  e.preventDefault();

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
    e.preventDefault();
  }
};

function codeSplitter_onmouseup ( e ) {
  App.codeSplitter.releaseCapture();
  App.codeSplitter.onmousemove = null;
  e.preventDefault();
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
  var prev = App.blocklyDiv;
  var next = App.consoleDiv;

  var y0 = e.clientY ;
  var ph0 = parseInt(window.getComputedStyle(prev).height, 10);
  var nh0 = parseInt(window.getComputedStyle(next).height, 10);

  App.consoleSplitter.setCapture();
  e.preventDefault();

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
    e.preventDefault();
  }
};


function consoleSplitter_onmouseup ( e )
{
  App.consoleSplitter.releaseCapture();
  App.consoleSplitter.onmousemove = null;
  e.preventDefault();
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
  App.script.onload = App.onload1;
  document.body.appendChild(App.script);
};


/*  A translation script has been loaded
 */
App.onload1 = function() {

  /*  Copy the translations and remove the script from the body
   */
  _ = TRANSLATIONS;
  document.body.removeChild(App.script);

  /* Translate Blockly's toolbox
   */
  var cats = document.getElementById('toolbox').children;
  for ( var i=0, cat ; cat=cats[i] ; i++ ) {
    if ( cat.id ) {
      cat.setAttribute('name', _[cat.id]);
    }
  }

  /*  Translate icons
   */
  icon_fileupload.title = _['icon-file-upload'];
  icon_filedownload.title = _['icon-file-download'];
  icon_trash.title = _['icon-discard'];

  /*  Translate discard-confirm window
   */
  var dialog = document.getElementById('modal-trash');
  dialog.getElementsByTagName('p')[0].innerHTML = _['discard-confirm'];
  dialog.getElementsByClassName('yes')[0].innerHTML = _['yes'];
  dialog.getElementsByClassName('no')[0].innerHTML = _['no'];

  App.consoleIcon.title = _['consoleIcon'];
  App.codeIcon.title = _['codeIcon'];

  /*  Load Blockly's translations
   */
  App.script  = document.createElement("script");
  App.script.src  = "blockly/msg/js/"+App.language+".js";
  App.script.type = "text/javascript";
  App.script.onload = App.onload2;
  document.body.appendChild(App.script);
};


/*  Blockly translations loaded: replace the workspace
 */
App.onload2 = function() {

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
      length: 1,
      colour: '#aaf',
      snap: true},
    trashcan: false
  };
  App.workspace = Blockly.inject('blocklyDiv', options);

  App.workspace.addChangeListener( function() {
    var icon = icon_trash || null ;
    if ( icon ) {
      var nblocks = App.workspace.getAllBlocks().length;
      if ( nblocks > 0 ) {
	icon.classList.remove('disabled');
	icon.onclick = onTrash ;
      }
      else {
	icon.classList.add('disabled');
	icon.onclick = null ;
      }
    }
    App.dirty = true;
  });

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



App.init = function() {

  App.workspace = null ;
  App.dirty = false ;
  App.blocklyDiv = document.getElementById('blocklyDiv');

  App.codeSplitter = document.getElementById('codeSplitter');
  App.codeSplitter.onmousedown = codeSplitter_onmousedown ;
  App.codeSplitter.onmouseup = codeSplitter_onmouseup ;
  App.codeDiv = document.getElementById('codeDiv');
  App.codeIcon = document.getElementById("codeIcon");
  App.codeIcon.onclick = codeIcon_onclick ;

  App.consoleSplitter = document.getElementById('consoleSplitter');
  App.consoleSplitter.onmousedown = consoleSplitter_onmousedown ;
  App.consoleSplitter.onmouseup = consoleSplitter_onmouseup ;
  App.consoleDiv = document.getElementById("consoleDiv");
  App.consoleIcon = document.getElementById("consoleIcon");
  App.consoleIcon.onclick = consoleIcon_onclick ;

  window.addEventListener('resize', App.layout, false);
  App.layout();

  /*
   */
  App.setup();
}


window.addEventListener('load', App.init);

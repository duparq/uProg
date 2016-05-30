
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


/*  After a translation script has been loaded, copy the translations, remove
 *  the script from the body and translate the application UI
 */
App.onload1 = function() {
  _ = TRANSLATIONS;
  document.body.removeChild(App.script);

  /* Inject language strings into Blockly's toolbox
   */
  //App.log("App.apply");
  var cats = document.getElementById('toolbox').children;
  for ( var i=0, cat ; cat=cats[i] ; i++ ) {
    if ( cat.id ) {
      //App.log("CAT "+i+": "+cat.id+" -> "+_[cat.id])
      cat.setAttribute('name', _[cat.id]);
    }
  }

  /*  File operations
   */
  icon_fileupload.title = _['icon-file-upload'];
  icon_filedownload.title = _['icon-file-download'];

  /*  Delete all
   */
  icon_trash.title = _['icon-discard'];
  var dialog = document.getElementById('modal-trash');
  dialog.getElementsByTagName('p')[0].innerHTML = _['discard-confirm'];
  dialog.getElementsByClassName('yes')[0].innerHTML = _['yes'];
  dialog.getElementsByClassName('no')[0].innerHTML = _['no'];

  /*  Console
   */
  icon_console.title = _['icon-console'];

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
  //App.log("App.onload2");

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

  App.resize();

  document.body.removeChild(App.script);
};



App.init = function() {

  App.workspace = null ;
  App.dirty = false ;
  App.blocklyDiv = document.getElementById('blocklyDiv');
  App.vsplitter = document.getElementById('vsplitter');

  window.addEventListener('resize', App.resize, false);
  App.resize();

  /*
   */
  App.setup();
}


window.addEventListener('load', App.init);

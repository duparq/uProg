
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/ublockly
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/* Localization of the user interface.
 */

'use strict';


/*  Namespace
 */
var l10n = {};
var _ = {};


/**
 * Initialize the page language.
 */
l10n.init = function() {

  /* Lookup for names of supported languages.  Keys should be in ISO 639 format.
   */
  var LANGNAMES = {
    'en': 'English',
    'fr': 'Français',
  };

  l10n.value = navigator.language;

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
  l10n.languages = languages;

  /*  Populate the language selector and select the current value
   */
  l10n.menu = document.getElementById('l10n');
  l10n.menu.options.length = 0;
  for (var i = 0; i < languages.length; i++) {
    var tuple = languages[i];
    var value = tuple[tuple.length - 1];
    var option = new Option(tuple[0], value);
    if (value === l10n.value) { option.selected = true; }
    l10n.menu.options.add(option);
  }

  l10n.menu.onchange = l10n.change ;
  l10n.change(); // Apply default translation
};


/*  Set up UI language change
 *    Load UI translation script according to the selected option
 *    Apply the translation
 */
l10n.change = function() {
  l10n.value = l10n.languages[l10n.menu.selectedIndex][1];
  l10n.script  = document.createElement("script");
  l10n.script.src  = "msg/"+l10n.value+".js";
  l10n.script.type = "text/javascript";
  l10n.script.onload = l10n.onload1;
  document.body.appendChild(l10n.script);
};


/*  After a translation script has been loaded, copy the translations, remove
 *  the script from the body and translate the application UI
 */
l10n.onload1 = function() {
  _ = TRANSLATIONS;
  document.body.removeChild(l10n.script);

  /* Inject language strings into Blockly's toolbox
   */
  //App.log("l10n.apply");
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
  l10n.script  = document.createElement("script");
  l10n.script.src  = "blockly/msg/js/"+l10n.value+".js";
  l10n.script.type = "text/javascript";
  l10n.script.onload = l10n.onload2;
  document.body.appendChild(l10n.script);
};


/*  Blockly translations loaded: replace the workspace
 */
l10n.onload2 = function() {
  //App.log("l10n.onload2");

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

  /*  Inject a new workspace
   */
  App.workspace = Blockly.inject('blocklyDiv',
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

  App.resize();

  document.body.removeChild(l10n.script);
};


/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/ublockly
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/* Translation of the user interface.
 */

'use strict';


/*  Namespace
 */
var UILANG = {};
UILANG.translations = {};


/*  Load and execute ui translation script according to the selected option in the
 *  menu
 */
UILANG.set = function() {
  UILANG.lang = UILANG.languages[UILANG.menu.selectedIndex][1];
  
  log("UILANG.set():");

  log("  UILANG.translations['"+UILANG.lang+"']: "+UILANG.translations[UILANG.lang]);
  if ( UILANG.translations[UILANG.lang] === undefined ) {
    var script  = document.createElement("script");
    script.src  = "msg/"+UILANG.lang+".js";
    script.type = "text/javascript";
    UILANG.script = script ;
    script.onload = UILANG.onload;
    log("  requires script '"+script.src+"'");
    document.body.appendChild(script);
  }
  else {
    UILANG.TRANSLATIONS = UILANG.translations[UILANG.lang];
    UILANG.translate();
  }
};


/*  Copy the translations and remove the script from the body
 */
UILANG.onload = function() {
  log("UILANG.loaded():");
  log("  TRANSLATIONS = "+TRANSLATIONS);
  UILANG.translations[UILANG.lang] = TRANSLATIONS;
  UILANG.TRANSLATIONS = TRANSLATIONS;
  document.body.removeChild(UILANG.script);
  log("  UILANG.translations['"+UILANG.lang+"']: "+UILANG.translations[UILANG.lang]);
  UILANG.translate();
};


UILANG.translate = function() {
  log("UILANG.translate():");
  for ( var tr in UILANG.TRANSLATIONS ) {
    var e = document.getElementById(tr);
    if ( e !== null ) {
      log("  '"+tr+"' -> '"+UILANG.TRANSLATIONS[tr]+"'");
      e.textContent = UILANG.TRANSLATIONS[tr];
    }
  }
};


/**
 * Initialize the page language.
 */
UILANG.init = function() {

  log("UILANG.init()");

  /* Lookup for names of supported languages.  Keys should be in ISO 639 format.
   */
  var LANGNAMES = {
    'en': 'English',
    'fr': 'Français',
  };

  UILANG.lang = navigator.language;

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
  UILANG.languages = languages;

  /*  Populate the menu.
   */
  UILANG.menu = document.getElementById('uilang');
  UILANG.menu.options.length = 0;
  for (var i = 0; i < languages.length; i++) {
    var tuple = languages[i];
    var lang = tuple[tuple.length - 1];
    var option = new Option(tuple[0], lang);
    if (lang === UILANG.lang) {
      option.selected = true;
    }
    UILANG.menu.options.add(option);
  }

  UILANG.menu.onchange = UILANG.set ;
  UILANG.set();
};


UILANG.init();

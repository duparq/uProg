
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


var hw = {};

/*  Initialize UI elements
 */
hw.setup = function ( ) {
  hw.id = 'hw' ;
  windowSetup( hw );
  hw.window.onwheel = hw.onWheel ;
  hw.i18n();
  hw.target = 'ATtiny85';
};


//  Zoom content
//
hw.onWheel = function ( e )
{
  // App.log("hw.onwheel dx="+e.deltaX+" dy="+e.deltaY);
  var z = 1 ;
  if ( e.deltaY < 0 )
    var z = 1.25 ;
  else if ( e.deltaY > 0 )
    var z = 0.8 ;
  if ( z != 1 ) {
    hw.width = hw.width*z ;
    if ( hw.width < hw.width0/2 )
      hw.width = hw.width0/2 ;
    else if ( hw.width > 2*hw.width0 )
      hw.width = 2*hw.width0 ;
    hw.window.content.firstChild.style.width = hw.width+'px';
    App.sessionIsDirty = true ;
  }
}


//  Load/Save session info
//
hw.restoreSession = function ( storage )
{
  var dic = windowRestoreSession( storage, hw.window );
  hw.width = dic.w || 0 ;
  hw.target = dic.t || 'ATtiny85' ;
  hw.load();
}


hw.saveSession = function ( storage )
{
  windowSaveSession( storage, hw.window, {'t': hw.target, 'w': hw.width});
}


//  Change language
//
hw.i18n = function ( ) {
  if ( App.language === 'fr' ) {
    // hw.icon.title = "Affiche ou cache le circuit cible.";
    hw.window.name.innerHTML = "Cible";
  }
  else {
    // hw.icon.title = "Show or hide the target device.";
    hw.window.name.innerHTML = "Target";
  }

  //  Translate pin's tooltips
  //
  var svg = hw.window.content.firstChild ;
  if ( svg ) {
    var pins = svg.querySelectorAll(".pin");
    var n = pins.length ;
    for (var i = 0 ; i < n ; i++) {
      var title = pins[i].getElementsByTagName("title")[0];
      title.removeChild(title.firstChild);
      if ( App.language === 'fr' ) {
	var text = document.createTextNode("Cliquez pour basculer l'état.");
      }
      else {
	var text = document.createTextNode("Click to toggle the state.");
      }
      title.appendChild(text);
    }
  }
}


//  Load window content
//
hw.load = function ( )
{
  var path = "hw/"+hw.target+".svg";
  var xhr = new XMLHttpRequest();
  xhr.open("GET",path, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if(xhr.status == 200)
	hw.loaded(xhr);
      else
	App.log("Loading of \""+path+"\" failed.");
    }
  };
  xhr.send("");
}

hw.loaded = function ( xhr )
{
  //  Put SVG object in the content div
  //
  var svg = xhr.responseXML.documentElement;
  var vb = svg.getAttribute('viewBox');
  hw.width0 = parseInt(vb.split(/\s+|,/)[2]) * 5;
  if ( ! hw.width )
    hw.width = hw.width0 ;
  svg.style.width = hw.width+'px';

  hw.window.content.appendChild(svg);

  //  Add titles and click handlers to pins
  //
  var pins = svg.querySelectorAll(".pin");
  var n = pins.length ;
  for (var i = 0 ; i < n ; i++) {
    pins[i].addEventListener("click", hw.onPinClick, false );
    var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    var text = document.createTextNode("Cliquez pour changer l'état");
    title.appendChild(text);
    pins[i].appendChild(title);
  }
}


//  Toggle pin state
//
hw.onPinClick = function ( e )
{
  var g = e.target.parentElement
  if ( g.classList.contains('on') ) {
    g.classList.remove('on')
    g.classList.add('off')
  }
  else {
    g.classList.remove('off')
    g.classList.add('on')
  }
}


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


var hw = {
  targets: {}
};


/*  Initialize UI elements
 */
hw.setup = function ( ) {
  App.log("hw.setup");

  hw.id = 'hw' ;
  windowSetup( hw );
  hw.window.content.style.width = '200px';
  hw.window.content.style.height = '400px';

  //  Handle 'config' button
  //
  var e = hw.window.bar.getElementsByClassName('config')[0];
  if ( e )
    e.onclick = hw.onConfigBtn ;

  //  Populate the targets selector and select the first one.
  //  Target scripts, loaded by index.html, have populated hw.targets{}.
  //
  var keys = Object.keys(hw.targets).sort();
  var select = hw.window.content.getElementsByTagName('select')[0];
  select.options.length = 0;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var option = new Option(key,key);
    select.options.add(option);
    if ( !hw.target ) {
      hw.target = hw.targets[key] ;
      option.selected = true ;
    }
  }
  select.onchange = hw.onTargetSelected ;

  hw.targetLoaded();
};


//  Load/Save session info
//
hw.saveSession = function ( storage )
{
  if ( hw.target != undefined )
    windowSaveSession( storage, hw.window, {'target': hw.target.name});
  else
    windowSaveSession( storage, hw.window, {'target': 'undefined'});
}


hw.restoreSession = function ( storage )
{
  App.log("hw.restoreSession");
  hw.target = undefined;
  var dic = windowRestoreSession( storage, hw.window );
  App.log("  dic.target: "+dic.target);
  if ( dic.target !== 'undefined' ) {
    if ( hw.targets[dic.target] )
      hw.target = hw.targets[dic.target];
    else
      App.log('Failed to load target "'+dic.target+'".');
  }
  hw.targetLoaded();
}


/*  Configure the target drawing
 */
hw.targetLoaded = function ( )
{
  //  Draw package
  //
  if ( hw.target ) {
    var pkg = svgDilPackage(hw.target.pins.length);
    pkg.getElementsByClassName('name')[0].textContent=hw.target.name;
  }
  else {
    var xmlns = "http://www.w3.org/2000/svg";
    var pkg = document.createElementNS(xmlns,'svg');
    pkg.setAttribute('class', 'device');
  }

  var old = hw.window.content.getElementsByTagName('svg')[0];
  if ( old ) {
    pkg.style.display = old.style.display;
    old.parentElement.replaceChild(pkg, old);
  }
  else
    hw.window.content.appendChild(pkg);

  if ( hw.target == undefined )
    return ;

  //  Name pins
  //
  hw.target.ios = {};
  var svgnames = pkg.querySelectorAll("#hw svg .pin .name");
  for ( var i=0 ; i<svgnames.length ; i++ ) {
    var svgpin = svgnames[i].parentElement;
    var name = hw.target.pins[i][0].name;
    var mode = hw.target.pins[i][0].mode;
    svgnames[i].textContent = name;

    //  Add titles and click handlers to pins
    //
    if ( mode == 'io' ) {
      hw.target.ios[name]=svgpin;
      var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      var text = document.createTextNode("Cliquez pour changer l'état");
      title.appendChild(text);
      svgpin.appendChild(title);
      svgpin.addEventListener("click", hw.onPinClick, false );
      svgpin.classList.add('io');
    }
  }
}


//  Change language
//
hw.i18n = function ( ) {
  if ( App.language === 'fr' ) {
    hw.window.name.innerHTML = "Cible";
  }
  else {
    hw.window.name.innerHTML = "Target";
  }

  //  Translate pin's tooltips
  //
  // var svg = hw.window.content.firstChild ;
  var svg = hw.window.content.getElementsByTagName('svg')[0];
  if ( svg ) {
    var pins = svg.querySelectorAll(".pin");
    for (var i = 0 ; i < pins.length ; i++) {
      var title = pins[i].getElementsByTagName("title")[0];
      if ( title )
	title.removeChild(title.firstChild);
      if ( App.language === 'fr' ) {
	var text = document.createTextNode("Cliquez pour basculer l'état.");
      }
      else {
	var text = document.createTextNode("Click to toggle the state.");
      }
      if ( title )
	title.appendChild(text);
    }
  }
}


//  Toggle pin state
//
hw.onPinClick = function ( ev )
{
  var g = ev.target.parentElement
  if ( g.classList.contains('on') ) {
    g.classList.remove('on')
    g.classList.add('off')
  }
  else {
    g.classList.remove('off')
    g.classList.add('on')
  }
}


//  Config button clicked: swap display between target/config panel
//
hw.onConfigBtn = function ( ev )
{
  App.log("hw.onConfigBtn");
  var config = hw.window.content.getElementsByClassName('config')[0];
  var svg = hw.window.content.getElementsByTagName('svg')[0];

  if ( config.style.display !== 'block' ) {
    config.style.display = 'block';
    svg.style.display = 'none';
  }
  else {
    config.style.display = 'none';
    svg.style.display = 'block';
  }
}


hw.onTargetSelected = function ( ev )
{
  var select = hw.window.content.getElementsByTagName('select')[0];
  if ( select.selectedIndex == 0 ) {
    hw.target = undefined ;
    hw.targetLoaded();
  }
  else {
    var name = select.options[select.selectedIndex].value;
    App.log("hw.onTargetSelected "+name);
    if ( hw.targets[name] ) {
      hw.target = hw.targets[name];
      hw.targetLoaded();
    }
  }
}


hw.write_io = function ( io, v )
{
  if ( hw.target == undefined ) {
    App.log("Can not set "+io+" to "+v+".");
    return;
  }

  var e = hw.target.ios[io];
  if ( e ) {
    if ( v == 0 ) {
      e.classList.remove('on')
      e.classList.add('off')
    }
    else if ( v == 1 ) {
      e.classList.remove('off')
      e.classList.add('on')
    }
    else
      App.log("Can not set "+io+" to "+v+".");
  }
}


hw.read_io = function ( io )
{
  if ( hw.target != undefined )
    return hw.target.ios[io].classList.contains('on');
  else
    return 0;
}

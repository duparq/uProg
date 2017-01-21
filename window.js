
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


//  Default position for windows
//
var windowx = 250 ;
var windowy = 14 ;


function windowSetup ( obj ) {
  var w = document.getElementById(obj.id);
  obj.window = w ;
  w.obj = obj ;
  w.onclick = function(e){ windowPutOnTop(w);} ;
  w.bar = w.getElementsByClassName('bar')[0];
  w.bar.onmousedown = function(e){windowOnBarMouseDown(w,e);} ;
  w.bar.onmouseup = function(e){windowOnBarMouseUp(w,e);} ;
  w.name = w.bar.getElementsByClassName('name')[0];
  w.plus = w.bar.querySelector('.plus');
  if ( w.plus ) {
    w.plus.onmousedown = function(e){ e.stopPropagation(); }
    w.plus.onmouseup = function(e){ e.stopPropagation(); }
    w.plus.onclick = function(e){ windowToggleDisplay(w,e);} ;
  }
  w.minus = w.bar.querySelector('.minus');
  if ( w.minus ) {
    w.minus.onmousedown = function(e){ e.stopPropagation(); }
    w.minus.onmouseup = function(e){ e.stopPropagation(); }
    w.minus.onclick = function(e){ windowToggleDisplay(w,e);} ;
  }
  w.content = w.getElementsByClassName('content')[0];

  //  Resizable window?
  //
  if ( w.classList.contains('resizable') ) {
    w.resizer = w.getElementsByClassName('resizer')[0];
    w.resizer.onmousedown = function(e){windowOnResizerMouseDown(w,e);} ;
    w.resizer.onmouseup = function(e){windowOnResizerMouseUp(w,e);} ;
  }

  //  Default window size and position
  //
  w.style.left = windowx+'px'; 
  w.style.top = windowy+'px'; windowy += 25 ;
  if ( w.classList.contains('resizable') ) {
    w.content.style.width = '100px';
    w.content.style.height = '100px';
  }

  //  Handle session backup/restore if the object does not do that itself
  //
  if ( !obj.restoreSession )
    obj.restoreSession = function(storage){ windowRestoreSession(storage, w); };

  if ( !obj.saveSession )
    obj.saveSession = function(storage){ windowSaveSession( storage, w, {}); };

  windowSetDisplay( w, false );
};


function windowRestoreSession ( storage, w )
{
  var json = storage.getItem( w.id );
  if ( json ) {
    var dic = JSON.parse(json);
    w.style.left = dic.x+'px';
    w.style.top = dic.y+'px';
    if ( w.classList.contains('resizable') ) {
      w.content.style.width = dic.w+'px';
      w.content.style.height = dic.h+'px';
    }
    windowSetDisplay( w, dic.d );
  }
  return dic ;
}


function windowSaveSession( storage, w, dic )
{
  //var w = document.getElementById( w.id );
  var style ;
  style = window.getComputedStyle( w );
  dic.x = parseInt(style.left, 10);
  dic.y = parseInt(style.top, 10);
  if ( w.classList.contains('resizable') ) {
    style = window.getComputedStyle( w.content );
    dic.w = parseInt(style.width, 10);
    dic.h = parseInt(style.height, 10);
  }
  dic.d = w.content.classList.contains('visible');
  storage[w.id] = JSON.stringify(dic);
}


function windowSetDisplay ( w, x )
{
  if ( x ) {
    if ( w.plus )
      w.plus.style.display = "none";
    if ( w.minus )
      w.minus.style.display = "block";
    w.content.classList.add('visible');
  }
  else {
    if ( w.plus )
      w.plus.style.display = "block";
    if ( w.minus )
      w.minus.style.display = "none";
    w.content.classList.remove('visible');
  }
  if ( w.obj.onDisplay )
    w.obj.onDisplay();
}


function windowToggleDisplay ( w, e )
{
  if ( w.content.classList.contains('visible') )
    windowSetDisplay( w, false );
  else
    windowSetDisplay( w, true );
  App.sessionIsDirty = true ;
}


//  Put window on top of others (displayed last)
//
function windowPutOnTop ( w )
{
  document.body.removeChild( w );
  document.body.appendChild( w );
}


//  Move a window
//
function windowOnBarMouseDown ( w, e )
{
  e.preventDefault();

  windowPutOnTop( w );

  App.setCapture(w.bar);
  var ex0 = e.clientX ;
  var ey0 = e.clientY ;
  var x0 = parseInt(window.getComputedStyle(w).left);
  var y0 = parseInt(window.getComputedStyle(w).top);

  w.bar.onmousemove = function ( e ) {
    var ex = e.clientX ;
    var ey = e.clientY ;
    var x = x0 + ex - ex0 ;
    var y = y0 + ey - ey0 ;

    /*  Keep the window's bar visible
     */
    var bw = parseInt(window.getComputedStyle(document.body).width);
    var bh = parseInt(window.getComputedStyle(document.body).height);
    var ww = parseInt(window.getComputedStyle(w).width);
    var wh = parseInt(window.getComputedStyle(w).height);
    var wbh = parseInt(window.getComputedStyle(w.bar).height);
    if ( x+ww < 20 )
      x = 20-ww ;
    else if ( x > bw-20 )
      x = bw-20 ;
    if ( y < 0 )
      y = 0 ;
    else if ( y > bh-wbh )
      y = bh-wbh ;

    w.style.left = x+'px';
    w.style.top = y+'px';
    e.preventDefault();
  }
};


function windowOnBarMouseUp ( w, e )
{
  e.preventDefault();
  w.bar.onmousemove = null ;
  App.setCapture(null);
  App.sessionIsDirty = true ;
};


//  Resize the window by resizing its content
//
function windowOnResizerMouseDown ( w, e )
{
  e.preventDefault();
  App.setCapture(w.resizer);
  var ex0 = e.clientX ;
  var ey0 = e.clientY ;
  var ww0 = parseInt(window.getComputedStyle(w.content).width);
  var wh0 = parseInt(window.getComputedStyle(w.content).height);
  App.sessionIsDirty = true ;

  w.resizer.onmousemove = function ( e ) {
    var ex = e.clientX ;
    var ey = e.clientY ;
    w.content.style.width = (ww0 + ex - ex0)+'px';
    w.content.style.height = (wh0 + ey - ey0)+'px';

    e.preventDefault();
  }
};


function windowOnResizerMouseUp ( w, e )
{
  e.preventDefault();
  w.resizer.onmousemove = null ;
  App.setCapture(null);
};

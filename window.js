
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


function windowSetup ( obj ) {
  obj.window = document.getElementById(obj.id);
  obj.window.obj = obj ;
  obj.window.bar = obj.window.getElementsByClassName('bar')[0];
  obj.window.bar.onmousedown = function(e){windowOnBarMouseDown(obj.window,e);} ;
  obj.window.bar.onmouseup = function(e){windowOnBarMouseUp(obj.window,e);} ;
  obj.window.name = obj.window.bar.getElementsByClassName('name')[0];
  obj.window.plus = obj.window.bar.querySelector('.plus');
  obj.window.plus.onmousedown = function(e){ e.stopPropagation(); }
  obj.window.plus.onmouseup = function(e){ e.stopPropagation(); }
  obj.window.plus.onclick = function(e){ windowOnClick(obj.window,e);} ;
  obj.window.minus = obj.window.bar.querySelector('.minus');
  obj.window.minus.onmousedown = function(e){ e.stopPropagation(); }
  obj.window.minus.onmouseup = function(e){ e.stopPropagation(); }
  obj.window.minus.onclick = function(e){ windowOnClick(obj.window,e);} ;
  obj.window.content = obj.window.getElementsByClassName('content')[0];

  if ( !obj.restoreSession )
    obj.restoreSession = function(storage){ windowRestoreSession(storage, obj.window); };
  if ( !obj.saveSession )
    obj.saveSession = function(storage){ windowSaveSession( storage, obj.window, {}); };

  windowSetDisplay( obj.window, false );
};


function windowRestoreSession ( storage, w )
{
  var json = storage.getItem( w.id );
  if ( json ) {
    var dic = JSON.parse(json);
    w.style.left = dic.x+'px';
    w.style.top = dic.y+'px';
    windowSetDisplay( w, dic.d );
  }
  return dic ;
}


function windowSaveSession( storage, w, dic )
{
  //var w = document.getElementById( w.id );
  var style = window.getComputedStyle( w );
  dic.x = parseInt(style.left, 10);
  dic.y = parseInt(style.top, 10);
  dic.d = w.content.classList.contains('visible');
  storage[w.id] = JSON.stringify(dic);
}


function windowSetDisplay ( w, x )
{
  if ( x ) {
    w.plus.style.display = "none";
    w.minus.style.display = "block";
    w.content.classList.add('visible');
  }
  else {
    w.plus.style.display = "block";
    w.minus.style.display = "none";
    w.content.classList.remove('visible');
  }
  if ( w.obj.onDisplay )
    w.obj.onDisplay();
}


function windowOnClick ( w, e )
{
  if ( w.content.classList.contains('visible') )
    windowSetDisplay( w, false );
  else
    windowSetDisplay( w, true );
  App.sessionIsDirty = true ;
}


//  Window: move
//
function windowOnBarMouseDown ( w, e )
{
  e.preventDefault();
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

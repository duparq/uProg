
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


"use_strict";

var ws = null;
var ip = null;
var port = null;
var check = null;
var values = null;
var min = null;
var max = null;
var average = null;
var hrtimes = [] ;
var toid ;

var output ;


function cout ( msg )
{
  var t = document.createTextNode(msg);
  output.appendChild(t);
}


function close ( )
{
  ws = null ;
  check.disabled = true;
  console.log("Disconnected.");
}


function wsOpen ( )
{
  cout("Connected.\n");
}


function wsClose ( )
{
  cout("Disconnected.\n");
  ws.close();
  ws = null ;
  document.getElementById("connect").checked = false ;
  document.getElementById("ip").disabled = false ;
  document.getElementById("port").disabled = false ;
  document.getElementById("command").disabled = true ;
}


function wsMessage ( ev )
{
  cout(ev.data+'\n');
}


function command ( )
{
  var command = document.getElementById("command") ;
  cout("$ "+command.value+"\n");
  ws.send(command.value);
  command.value = "";
}


function connect ( )
{
  var ip = document.getElementById("ip") ;
  var port = document.getElementById("port") ;
  var command = document.getElementById("command");

  if ( document.getElementById("connect").checked ) {
    cout("Connect.\n");
    ip.disabled = true ;
    port.disabled = true ;
    command.disabled = false ;
    ws = new WebSocket("ws:"+ip.value+":"+port.value);
    ws.onopen = wsOpen ;
    ws.onclose = wsClose ;
    ws.onmessage = wsMessage ;
  }
  else {
    cout("Disconnect.\n");
    ip.disabled = false ;
    port.disabled = false ;
    command.disabled = true ;
    ws.close();
  }
}


window.onload = function()
{
  output = document.getElementById("console") ;
  document.getElementById("connect").onchange = connect ;
  document.getElementById("command").onchange = command ;
  document.getElementById("command").disabled = true ;
}

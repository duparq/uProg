
var ws = null;
var server_ip = null;
var server_port = null;
var check = null;
var values = null;
var min = null;
var max = null;
var average = null;
var hrtimes = [] ;


function connect ( ) {

  ws = new WebSocket("ws:"+server_ip.value+":"+server_port.value);

  ws.onopen = function (event) {
    console.log("Connected.");
    check.disabled = false;
    setTimeout( run, 100 );
  };

  ws.onclose = function (event) {
    ws = null ;
    check.disabled = true;
    console.log("Disconnected.");
    setTimeout( connect, 1000 );
  };

  ws.onmessage=function(event) {
    if ( event.data.startsWith('HRTIME:') ) {
      hrtimes.push(event.data.substring(7));
      if ( hrtimes.length < 501 ) {
	ws.send('HRTIME');
      }
      else {
	var us = [];
	var t0 = parseInt(hrtimes[0]);
	var avg = t0 ;
	for ( var i=1 ; i<hrtimes.length ; i++ ) {
	  var t = parseInt(hrtimes[i]) ;
	  us.push( t-t0 );
	  t0 = t ;
	}
	values.innerHTML = us.length.toString();
	min.innerHTML = Math.round( Math.min.apply(null, us) ).toString();
	max.innerHTML = Math.round( Math.max.apply(null, us) ).toString();
	average.innerHTML = Math.round( (t0-avg) / (hrtimes.length-1) ).toString();
	if ( check.checked )
	  setTimeout( run, 100 );
      }
    }
  };
}


window.onload=function() {
  document.getElementById("form").onsubmit = function(ev) { ev.preventDefault(); };

  server_ip = document.getElementById("server_ip");
  server_ip.onchange = function() { connect(); };

  server_port = document.getElementById("server_port");
  server_port.onchange = function() { connect(); };

  check = document.getElementById("check");
  check.onchange = function() { if ( check.checked ) run(); };

  values = document.getElementById("values");
  min = document.getElementById("min");
  max = document.getElementById("max");
  average = document.getElementById("average");
  
  connect();
}


function run ( ) {
  console.log("run");
  hrtimes = [] ;
  if ( ws === null ) {
    console.log("No server.");
    return;
  }
  ws.send('HRTIME');
}

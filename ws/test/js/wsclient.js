
var ws = new WebSocket("ws://localhost:8080");
var canvas;
var context;
var image = new Image();
var microseconds = [] ;

window.onload=function() {
  canvas = document.getElementById("picture");
  context = canvas.getContext("2d");
}

function dispMessage(str) {
  document.getElementById("message").innerHTML = str;
}

ws.onopen = function (event) {
  ws.send('{ "type":"text", "content":"Browser ready."}' ); 
};


ws.onmessage=function(event) {
  if ( event.data[0]==='{' ) {
    var message = JSON.parse(event.data);
    switch(message.type) {
    case "text":
      dispMessage(message.content);
      break;
    case "image":
      var iname = message.path;
      dispMessage("Received " + iname); 
      image.src= iname
      image.onload = function () { context.drawImage(image, 0, 0); }
      break;
    }
  }
  else {
    //console.log(event.data);
    if ( event.data.startsWith('microseconds:') ) {
      microseconds.push(event.data.substring(13));
      if ( microseconds.length < 501 ) {
	ws.send('microseconds');
      }
      else {
	var us = [];
	var t0 = parseInt(microseconds[0]);
	var avg = t0 ;
	for ( var i=1 ; i<microseconds.length ; i++ ) {
	  var t = parseInt(microseconds[i]) ;
	  us.push( t-t0 );
	  t0 = t ;
	}
	avg = Math.round( (t0-avg) / (microseconds.length-1) );
	var min = Math.round( Math.min.apply(null, us) );
	var max = Math.round( Math.max.apply(null, us) );
	var msg = "" ;
	msg += us.length+" values<br>" ;
	msg += "min: "+min+" µs<br>" ;
	msg += "max: "+max+" µs<br>" ;
	msg += "avg: "+avg+" µs" ;
	document.getElementById("message").innerHTML = msg;
      }
    }
  }
};


function helloServer()
{
  setTimeout(function() {
    ws.send('{ "type": "image", "content":"Send me a picture"}'); 
  }, 50);
}


function getMicroseconds()
{
  //console.log("getMicroseconds");
  microseconds = [] ;
  ws.send('microseconds');
}

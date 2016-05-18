// WS Server
// (c) 2014 Xul.fr

// Example of WebSocket use...


var WebSocketServer = require("ws").Server;
var fs = require("fs");

var ws = new WebSocketServer( { port: 8080 } );

console.log("Server started...");

ws.on('connection', function (ws) {
  console.log("Browser connected online...")
  
  ws.on("message", function (str) {
    //console.log("Message: "+str);
    if ( str[0]==='{' ) {
      var ob = JSON.parse(str);
      switch(ob.type) {
      case 'text':
	console.log("Received: " + ob.content)
	ws.send('{ "type":"text", "content":"Server ready."}')
	break;
      case 'image':
	console.log("Received: " + ob.content)         
	console.log("Here is an apricot...")
	var path ="apricot.jpg";   
	console.log("Sending image: " + path);
	fs.exists(path, function(result) {
          var data = '{ "type":"image", "path":"' + path + '"}';
          ws.send(data); 
	});
	break;
      // case 'microseconds':
      // 	var t = process.hrtime();
      // 	var t = t[0]*1e6 + t[1]*1e-3
      // 	var s = t.toString();
      // 	//console.log("microseconds:"+s)
      // 	ws.send('{ "type":"microseconds", "content":'+s+'}')
      // 	break;
      }
    }
    else if ( str==='microseconds' ) {
      var t = process.hrtime();
      var t = t[0]*1e6 + t[1]*1e-3
      var s = t.toString();
      //console.log("microseconds:"+s)
      //ws.send('{ "type":"microseconds", "content":'+s+'}')
      ws.send('microseconds:'+s)
    }   
  })

  ws.on("close", function() {
    console.log("Browser gone.")
  })
});

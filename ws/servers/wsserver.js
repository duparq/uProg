
'use strict';

/*  Get the IP address of the host
 */
var host = "127.0.0.1" ;
var port = "8080" ;

function host_ip()
{
  var os = require('os');
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname) {
    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
	// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
	return;
      }
      //ip = iface.address ;
      return iface.address ;
    });
  });
}


/*  Parse arguments
 */
if ( process.argv.length > 2 ) {
  host = process.argv[2];
  if ( /((^|\.)((25[0-5])|(2[0-4]\d)|(1\d\d)|([1-9]?\d))){4}$/.test(host) ) {
    if ( process.argv.length > 3 )
      port = process.argv[3];
    try {
      port = parseInt(port, 10);
    }
    catch (e) {
      usage();
      return;
    }
  }
  else {
    usage();
    return;
  }
}


console.log("Starting server at address "+host+", port:"+port+".");

var WebSocketServer = require("ws").Server;
var ws = new WebSocketServer( { host:host, port:port } );

ws.on('connection', function (ws) {
  console.log("Connected.")

  ws.on("message", function (str) {
    console.log("Message: "+str);
    if ( str==='HRTIME' ) {
      var t = process.hrtime();
      var t = t[0]*1e6 + t[1]*1e-3
      var s = t.toString();
      console.log("  -> "+s);
      ws.send('HRTIME:'+s)
    }
    else {
      console.log("UNKNOWN COMMAND: "+str)
    }
  })

  ws.on("close", function() {
    console.log("Disconnected.")
  })
});

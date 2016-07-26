
/*  Simple http server for testing purposes.
 *  Commande line:
 *
 *    $ node httpserver.js
 */

var http = require('http');

var handleRequest = function(request, response) {
  console.log("Request: "+request);
  response.writeHead(200);
  response.end("Bonjour le monde!");
}

var www = http.createServer(handleRequest);
www.listen(8088);


'use strict';

log("Started");

var splitter = document.getElementById('splitter');
var bly = document.getElementById('blockly');
var cons = document.getElementById('console');


splitter.onmousedown = function(e) {
  // var prev = splitter.previousSibling;
  // var next = splitter.nextSibling;

  var prev = document.getElementById('blockly');
  var next = document.getElementById('console');

  var y0 = e.clientY ;
  var ph0 = parseInt(window.getComputedStyle(prev).height, 10);
  var nh0 = parseInt(window.getComputedStyle(next).height, 10);

  log("Body height: "+document.body.offsetHeight);

  log("Splitter mouse down: "+y0+" "+ph0+" "+nh0);
  splitter.setCapture();
  e.preventDefault();

  splitter.onmousemove = function(e) {
    var dy = y0 - e.clientY ;
    var pmh = parseInt(window.getComputedStyle(prev).minHeight,10) ;
    var nmh = parseInt(window.getComputedStyle(next).minHeight,10) ;

    if ( (pmh != pmh || ph0-dy >= pmh) &&
	 (nmh != nmh || nh0+dy >= nmh) ) {
      prev.style.height = ph0-dy+'px' ;
      next.style.height = nh0+dy+'px' ;
    }
    e.preventDefault();
  }
};

splitter.onmouseup = function(e) {
  splitter.releaseCapture();
  splitter.onmousemove = null;
  e.preventDefault();
};


/*  Show/hide console
 */
bly.onclick = function() {
  var d = window.getComputedStyle(cons).display ;
  log("Display: "+d);
  if ( d === "none" ) {
    splitter.style.display="block";
    cons.style.display="block";
  }
  else {
    splitter.style.display="none";
    cons.style.display="none";
  }
  resize();
};


/*  Adjust the height of the 'blockly' element 
 */
function resize ( ) {
  //log("Resize");
  var dbch = document.body.clientHeight;
  var bh = parseInt(window.getComputedStyle(bly).height, 10);

  var cb ;
  if ( window.getComputedStyle(cons).display !== "none" ) {
    cb = cons.offsetTop + parseInt(window.getComputedStyle(cons).height, 10);
  }
  else {
    cb = bly.offsetTop + parseInt(window.getComputedStyle(bly).height, 10);
  }

  //log ("  body="+dbch+" ct="+cons.offsetTop+" cb="+(ct+ch)+" bh="+bh);
  bly.style.height = (bh + dbch - cb // + document.body.style.borderTopWidth
		     )+'px' ;
}


window.addEventListener('resize', resize, false);
resize();

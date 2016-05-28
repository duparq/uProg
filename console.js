
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/ublockly
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/*  Console
 */

'use strict';

var cons = document.getElementById('console');


/*  Display and log messages
 */
function log(msg)
{
  console.log(msg);
  var c = document.getElementById("console");
  var x_scroll = c.scrollHeight - c.clientHeight <= c.scrollTop + 1;

  c.innerHTML = c.innerHTML.concat(msg+"\r\n");

  if (x_scroll)
    c.scrollTop = c.scrollHeight - c.clientHeight;
}


/*  Icon
 */
var icon_console = document.getElementById("icon_console");
if ( icon_console ) {
  /*
   *  Show/hide the console
   */
  icon_console.onclick = function() {
    //log("CONSOLE");
    var d = window.getComputedStyle(cons).display ;
    //log("Display: "+d);
    if ( d === "none" ) {
      vsplitter.style.display="block";
      cons.style.display="block";
    }
    else {
      vsplitter.style.display="none";
      cons.style.display="none";
    }
    resize();
  };

  icon_console.title = "Show or hide console";
}

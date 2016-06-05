
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/ublockly
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';

var log = {};


/*  Display and log messages
 */
log.sim = function ( msg )
{
  console.log(msg);
  var c = App.consoleDiv;
  c.innerHTML = c.innerHTML.concat('<span class="sim">'+msg+'\r\n</span>');
  c.scrollTop = c.scrollHeight - c.clientHeight;
};


log.dbg = function ( msg )
{
  console.log(msg);
  var c = App.consoleDiv;
  c.innerHTML = c.innerHTML.concat('<span class="dbg">'+msg+'\r\n</span>');
  c.scrollTop = c.scrollHeight - c.clientHeight;
};

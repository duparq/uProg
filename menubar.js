
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/ublockly
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at 
 * http://www.apache.org/licenses/LICENSE-2.0
 */

/*  Initialize menus
 *    Compute and add element ids
 *    Add event handlers
 */
var opened_menu = null ;
var menubar = document.getElementById("menubar");
var menus = menubar.children
for (i = 0 ; i < menus.length ; i++) {
  /*
   *  Process all menus of the menubar
   */
  var menu = menus[i]
  var menu_name = menu.children[0].getAttribute("name")
  menu.children[0].id = "menu-"+menu_name
  var content = menu.children[1]
  var entries = content.children
  log("Create menu: "+menu_name);
  menu.onclick = onMenuClick ;
  menu.onmouseover = onMouseOverMenu ;
  for ( j=0 ; j<entries.length ; j++ ) {
    /*
     *  Process all entries of a menu
     */
    var entry = entries[j]
    var name = entry.getAttribute("name")
    entry.id = "menu-"+menu_name+"-"+name
    entry.onclick = onMenuEntryClick ;
    log("  Create entry: "+name);
  }
}


// log("Navigator language: "+navigator.language);
// log("  body: height="+document.body.style.height)
// log("  workarea: h="+document.getElementById("console").clientHeight);


/*  Close the opened menu if the user clicks outside of it
 */
window.onclick = function(ev) {
//  log("window.onclick(): ?");
  close_menus();
}


/*  Close any opened menu
 */
function close_menus ( )
{
  if ( opened_menu !== null ) {
    log("close_menus: "+opened_menu);
    opened_menu.children[0].classList.remove("opened");
    opened_menu.children[1].classList.remove("show");
    opened_menu = null ;
  }
}


/*  Open a menu
 */
function open_menu ( menu )
{
  close_menus();
  log("open_menu: "+menu);
  menu.children[0].classList.add("opened");
  menu.children[1].classList.add("show");
  opened_menu = menu ;
}


/*  Change opened menu
 */
function onMouseOverMenu(ev) {
  log("onMouseOverMenu()");
  if ( opened_menu !== null && opened_menu !== this ) {
    open_menu(this);
    ev.stopPropagation();
  }
}


/*  Open menu
 */
function onMenuClick(ev) {
  log("onMenuClick()");
  if ( this !== opened_menu )
    open_menu(this);
  else
    close_menus();

  /* Stop propagation, otherwize the window will get the event and
   * close the just opened menu!
   */
  ev.stopPropagation();
}


/*  Do action and close menu
 */
function onMenuEntryClick(ev) {
  close_menus();
  ev.stopPropagation();
  log("onMenuEntryClick(): "+this.getAttribute("name")+" "+this.id);
}


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

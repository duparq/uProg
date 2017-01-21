
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/uprog
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';


var source = {};


/*  Initialize UI elements
 */
source.setup = function ( )
{
  source.id = 'source' ;
  windowSetup( source );
  // source.i18n();

  source.window.onresize = source.onresize ;
};


//  Load/Save session info
//
source.restoreSession = function ( storage )
{
  var dic = windowRestoreSession( storage, source.window );
  if ( dic ) {
    source.width = dic.w ;
  }
};

source.saveSession = function ( storage )
{
  windowSaveSession( storage, source.window, {'t': source.target, 'w': source.width});
};


//  Change language
//
source.i18n = function ( )
{
  if ( App.language === 'fr' ) {
    source.window.name.innerHTML = "Code source";
  }
  else {
    source.window.name.innerHTML = "Source code";
  }
};


source.onresize = function ( e )
{
  App.log("source.onresize");
}


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


var logger = {};

/*  Initialize UI elements
 */
logger.setup = function ( ) {
  logger.id = 'logger' ;
  windowSetup( logger );
  logger.i18n();
};


//  Load/Save session info
//
logger.restoreSession = function ( storage )
{
  var dic = windowRestoreSession( storage, logger.window );
  if ( dic ) {
    logger.width = dic.w ;
  }
};

logger.saveSession = function ( storage )
{
  windowSaveSession( storage, logger.window, {'t': logger.target, 'w': logger.width});
};


//  Change language
//
logger.i18n = function ( )
{
  if ( App.language === 'fr' ) {
    logger.window.name.innerHTML = "Messages";
  }
  else {
    logger.window.name.innerHTML = "Messages";
  }
};

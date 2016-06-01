
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


/*  Icons
 */
var icon_fileupload = document.getElementById("icon-file-upload");
var icon_filedownload = document.getElementById("icon-file-download");
var icon_trash = document.getElementById("icon-trash");

var file = {} ;
file.name = 'ublockly.xml'

document.title = file.name ;


/*  File loader: loads an XML file from the users file system and adds the
 *  blocks into the Blockly workspace.
 */
if ( icon_fileupload ) {

  icon_fileupload.onclick = function() {

    /*  Handle file input dialog
     */
    var onFileInput = function(e) {
      var reader = new FileReader();
      reader.onload = function() {
	App.log("file_upload()");

	var dom = null;
	try { dom = Blockly.Xml.textToDom( reader.result ); } catch (e) {}
	if ( dom ) {
	  try {
	    Blockly.Xml.domToWorkspace(dom, App.workspace);
	    document.title = file.name ;
	  } catch (e) { dom = null; }
	}
	if ( dom === null ) {
          alert('Invalid XML');
	  App.log('The XML file was not successfully parsed into blocks.' +
              'Please review the XML code and try again.');
	}
      };

      file = e.target.files[0];
      App.log("file name="+file.name);
      reader.readAsText(file);
    };

    /*  Create once invisible browse button with event listener, and click it
     */
    var fileinput = document.getElementById('file-input');
    if (fileinput == null) {
      var fileinputDom = document.createElement('INPUT');
      fileinputDom.type = 'file';
      fileinputDom.id = 'file-input';

      var fileinputWrapperDom = document.createElement('DIV');
      fileinputWrapperDom.id = 'file-input-wrapper';
      fileinputWrapperDom.style.display = 'none';
      fileinputWrapperDom.appendChild(fileinputDom);

      document.body.appendChild(fileinputWrapperDom);
      fileinput = document.getElementById('file-input');
      fileinput.addEventListener('change', onFileInput, false);
    }
    fileinput.click();

  };

  //  icon_fileupload.title = l10n.TRANSLATION[icon_fileupload];
  icon_fileupload.title = "Load a file";
}


if ( icon_filedownload ) {

  icon_filedownload.onclick = function() {
    var xmldom = Blockly.Xml.workspaceToDom(App.workspace);
    var xmltext = Blockly.Xml.domToPrettyText(xmldom);
    var blob = new Blob([xmltext], {type: 'text/plain;charset=utf-8'});
    saveAs(blob, file.name);

    /*  There is no way to know if the user actually saved the file or
     *  cancelled. Assume he did save.
     */
    App.dirty = false ;
  };

  //  icon_filedownload.title = l10n.TRANSLATION[icon_filedownload];
  icon_filedownload.title = "Save sketch into a file";
}

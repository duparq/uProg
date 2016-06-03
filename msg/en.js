
/*  English translations
 */

App.fileUploadIcon.title = "Upload a file to add blocks.";
App.fileDownloadIcon.title = "Download.";
App.trashIcon.title = "Delete all blocks.";
App.consoleIcon.title = "Show or hide the console.";
App.codeIcon.title = "Show or hide the generated code.";
App.targetIcon.title = "Show or hide the target.";

/*  Blockly's toolbox
 */
document.getElementById('catFunctions').setAttribute('name', 'Functions');
document.getElementById('catControls').setAttribute('name', 'Controls');
document.getElementById('catLogic').setAttribute('name', 'Logic');
document.getElementById('catMath').setAttribute('name', 'Arithmetic');
document.getElementById('catVariables').setAttribute('name', 'Variables');
document.getElementById('catOthers').setAttribute('name', 'Miscellaneous');

/*  Translate discard-confirm window
 */
var e = App.modalDiscardConfirm
e.getElementsByTagName('p')[0].innerHTML = "Do you actually want to discard all the blocks?";
e.getElementsByClassName('yes')[0].innerHTML = "Yes";
e.getElementsByClassName('no')[0].innerHTML = "No";

/*  Load Blockly's translations
 */
document.body.removeChild(App.script);
App.script = null ;

App.script = document.createElement("script");
App.script.src  = "blockly/msg/js/en.js";
App.script.type = "text/javascript";
App.script.onload = App.translateBlockly;
document.body.appendChild(App.script);


/*  English translations
 */

/*  Icons
 */
App.fileUploadIcon.title = "Upload a file to add blocks.";
App.fileDownloadIcon.title = "Download.";
App.trashIcon.title = "Delete all blocks.";
App.consoleIcon.title = "Show or hide the console.";
App.codeIcon.title = "Show or hide the generated code.";

/*  Blockly's toolbox
 */
document.getElementById('catProcedures').setAttribute('name', 'Procedures');
document.getElementById('catControls').setAttribute('name', 'Controls');
document.getElementById('catLogic').setAttribute('name', 'Logic');
document.getElementById('catMath').setAttribute('name', 'Arithmetic');
document.getElementById('catVariables').setAttribute('name', 'Variables');

/*  Translate discard-confirm window
 */
var e = App.modalDiscardConfirm
e.getElementsByTagName('p')[0].innerHTML = "Do you actually want to discard all the blocks?";
e.getElementsByClassName('yes')[0].innerHTML = "Yes";
e.getElementsByClassName('no')[0].innerHTML = "No";

/*  Simulator
 */
App.simulatorIcon.title = "Open the simulator.";
simulator.playIcon.title = "Start or resume the execution.";
simulator.pauseIcon.title = "Pause the execution.";
simulator.stopIcon.title = "Stop the execution.";
simulator.stepIcon.title = "Execute one statement.";
simulator.speedRange.title = "Minimum delay between two statements.";
simulator.speedSpan.title = simulator.speedRange.title;
document.getElementById('simulatorQuit').title = "Close the simulator."
App.MSG.SIMULATOR_READY = "Ready to execute.";
App.MSG.SIMULATOR_STARTED = "Execution in progress.";
App.MSG.SIMULATOR_DONE = "Execution complete. ";

/*  Load Blockly's translations
 */
document.body.removeChild(App.script);
App.script = null ;
App.script = document.createElement("script");
App.script.src  = "blockly/msg/js/en.js";
App.script.type = "text/javascript";
App.script.onload = App.translateBlockly;
document.body.appendChild(App.script);

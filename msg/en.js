
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

/*  Debugger
 */
App.zdebuggerIcon.title = "Open the zdebugger.";
zdebugger.windowBar.innerHTML = "Debugger";
zdebugger.playIcon.title = "Start or resume the execution.";
zdebugger.pauseIcon.title = "Pause the execution.";
zdebugger.stopIcon.title = "Stop the execution.";
zdebugger.stepIcon.title = "Execute one statement.";
zdebugger.speedRange.title = "Minimum delay between two statements.";
zdebugger.speedSpan.title = zdebugger.speedRange.title;
document.getElementById('zdebuggerQuit').title = "Close the zdebugger."
App.MSG.DEBUGGER_READY = "Ready to execute.";
App.MSG.DEBUGGER_STARTED = "Execution in progress.";
App.MSG.DEBUGGER_DONE = "Execution complete. ";
Blockly.Msg.MONITOR_VARIABLE = "Monitor" ;
document.getElementById('zdebuggerMonitoringLabel').innerHTML = "Monitored variables:"

/*  Load Blockly's translations
 */
document.body.removeChild(App.script);
App.script = null ;
App.script = document.createElement("script");
App.script.src  = "blockly/msg/js/en.js";
App.script.type = "text/javascript";
App.script.onload = App.translateBlockly;
document.body.appendChild(App.script);

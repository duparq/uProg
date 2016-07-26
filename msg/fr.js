
/*  French translations
 */

/*  Icons
 */
App.trashIcon.title = "Supprime tous les blocs.";
App.consoleIcon.title = "Affiche ou cache la console.";
App.codeIcon.title = "Affiche ou cache le code produit.";

/*  Blockly's toolbox
 */
document.getElementById('catIO').setAttribute('name', 'Entrées & sorties');
document.getElementById('catLogic').setAttribute('name', 'Logique');
document.getElementById('catMath').setAttribute('name', 'Opérations');
document.getElementById('catStructures').setAttribute('name', 'Structures');
document.getElementById('catTime').setAttribute('name', 'Temps');
document.getElementById('catVariables').setAttribute('name', 'Variables');

/*  Translate discard-confirm window
 */
var e = App.modalDiscardConfirm
e.getElementsByTagName('p')[0].innerHTML = "Supprimer tous les blocs ?";
e.getElementsByClassName('yes')[0].innerHTML = "Oui";
e.getElementsByClassName('no')[0].innerHTML = "Non";

/*  Debugger
 */
App.zdebuggerIcon.title = "Ouvre le simulateur.";
zdebugger.windowName.innerHTML = "Débogueur";
zdebugger.playIcon.title = "Lance ou reprend l'exécution.";
zdebugger.pauseIcon.title = "Suspend l'exécution.";
zdebugger.stopIcon.title = "Arrête l'exécution.";
zdebugger.stepIcon.title = "Exécute une seule instruction.";
zdebugger.speedRange.title = "Délai minimum entre deux instructions.";
zdebugger.speedSpan.title = zdebugger.speedRange.title;
App.Msg = App.Msg || {};
App.Msg.DEBUGGER_READY = "Prêt pour exécuter.";
App.Msg.DEBUGGER_STARTED = "Exécution en cours.";
App.Msg.DEBUGGER_DONE = "Exécution terminée. ";
Blockly.Msg.MONITOR_VARIABLE = "Surveiller" ;
document.getElementById('zdebuggerMonitoringLabel').innerHTML = "Variables surveillées :"

/*  Load Blockly's translations
 */
document.body.removeChild(App.script);
App.script = null ;
App.script = document.createElement("script");
App.script.src  = "blockly/msg/js/fr.js";
App.script.type = "text/javascript";
App.script.onload = App.translateBlockly;
document.body.appendChild(App.script);


/*  French translations
 */

/*  Icons
 */
App.fileUploadIcon.title = "Charge des blocs depuis un fichier.";
App.fileDownloadIcon.title = "Télécharge le fichier de ces blocs.";
App.trashIcon.title = "Supprime tous les blocs.";
App.consoleIcon.title = "Affiche ou cache la console.";
App.codeIcon.title = "Affiche ou cache le code produit.";

/*  Blockly's toolbox
 */
document.getElementById('catProcedures').setAttribute('name', 'Procédures');
document.getElementById('catControls').setAttribute('name', 'Contrôles');
document.getElementById('catLogic').setAttribute('name', 'Logique');
document.getElementById('catMath').setAttribute('name', 'Opérations');
document.getElementById('catVariables').setAttribute('name', 'Variables');
document.getElementById('catIO').setAttribute('name', 'Entrées & sorties');

/*  Translate discard-confirm window
 */
var e = App.modalDiscardConfirm
e.getElementsByTagName('p')[0].innerHTML = "Voulez-vous vraiment supprimer tous les blocs ?";
e.getElementsByClassName('yes')[0].innerHTML = "Oui";
e.getElementsByClassName('no')[0].innerHTML = "Non";

/*  Simulator
 */
App.simulatorIcon.title = "Ouvre le simulateur.";
simulator.playIcon.title = "Lance ou reprend l'exécution.";
simulator.pauseIcon.title = "Suspend l'exécution.";
simulator.stopIcon.title = "Arrête l'exécution.";
simulator.stepIcon.title = "Exécute une seule instruction.";
simulator.speedRange.title = "Délai minimum entre deux instructions.";
simulator.speedSpan.title = simulator.speedRange.title;
document.getElementById('simulatorQuit').title = "Ferme le simulateur."
simulator.windowBar.innerHTML = "Simulateur";
App.MSG.SIMULATOR_READY = "Prêt pour exécuter.";
App.MSG.SIMULATOR_STARTED = "Exécution en cours.";
App.MSG.SIMULATOR_DONE = "Exécution terminée. ";

/*  Load Blockly's translations
 */
document.body.removeChild(App.script);
App.script = null ;
App.script = document.createElement("script");
App.script.src  = "blockly/msg/js/fr.js";
App.script.type = "text/javascript";
App.script.onload = App.translateBlockly;
document.body.appendChild(App.script);

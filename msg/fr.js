
/*  English translations
 */

/*  Icons
 */
App.fileUploadIcon.title = "Charge des blocs depuis un fichier.";
App.fileDownloadIcon.title = "Télécharge le fichier de ces blocs.";
App.trashIcon.title = "Supprime tous les blocs.";
App.consoleIcon.title = "Affiche ou cache la console.";
App.codeIcon.title = "Affiche ou cache le code produit.";
App.targetIcon.title = "Affiche ou cache la fenêtre de la cible.";
App.playIcon.title = "Lance ou reprend la simulation.";
App.pauseIcon.title = "Suspend la simulation.";
App.stopIcon.title = "Arrête la simulation.";
App.stepIcon.title = "Suspend la simulation après l'instruction suivante.";
App.speedRange.title = "Délai entre deux instructions.";

/*  Blockly's toolbox
 */
document.getElementById('catFunctions').setAttribute('name', 'Fonctions');
document.getElementById('catControls').setAttribute('name', 'Contrôles');
document.getElementById('catLogic').setAttribute('name', 'Logique');
document.getElementById('catMath').setAttribute('name', 'Calculs');
document.getElementById('catVariables').setAttribute('name', 'Variables');
document.getElementById('catOthers').setAttribute('name', 'Autres');

/*  Translate discard-confirm window
 */
var e = App.modalDiscardConfirm
e.getElementsByTagName('p')[0].innerHTML = "Voulez-vous vraiment supprimer tous les blocs ?";
e.getElementsByClassName('yes')[0].innerHTML = "Oui";
e.getElementsByClassName('no')[0].innerHTML = "Non";

App.MSG.SIMULATOR_READY = "Simulateur prêt.";
App.MSG.SIMULATOR_STARTED = "Simulateur lancé.";
App.MSG.SIMULATOR_DONE = "Simulation terminée. ";

/*  Load Blockly's translations
 */
document.body.removeChild(App.script);
App.script = null ;

App.script = document.createElement("script");
App.script.src  = "blockly/msg/js/fr.js";
App.script.type = "text/javascript";
App.script.onload = App.translateBlockly;
document.body.appendChild(App.script);

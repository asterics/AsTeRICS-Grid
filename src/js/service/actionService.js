import {dataService} from "./dataService";
import {Router} from "./../router";

if (typeof SpeechSynthesisUtterance !== 'undefined') {
    window.speechSynthesis.getVoices();
}
var _voices = {};

var actionService = {
    doAction: function (gridId, gridElementId) {
        dataService.getGridElement(gridId, gridElementId).then(gridElement => {
            log.info('do actions for: ' + gridElement.label);
            doActions(gridElement);
        });
    },
    testAction: function (gridElement, action) {
        doAction(gridElement, action);
    }
};

function doActions(gridElement) {
    gridElement.actions.forEach(action => {
        doAction(gridElement, action);
    });
}

function doAction(gridElement, action) {
    switch (action.modelName) {
        case 'GridActionSpeak':
            log.debug('action speak');
            speak(gridElement.label, action);
            break;
        case 'GridActionNavigate':
            log.debug('action navigate');
            Router.toGrid(action.toGridId);
            break;
    }
}

function speak(text, action) {
    if (typeof SpeechSynthesisUtterance !== 'undefined') {
        var msg = new SpeechSynthesisUtterance(text);
        msg.voice = getVoice(action.speakLanguage);
        //log.info('used voice: ' + msg.voice.name);
        window.speechSynthesis.speak(msg);
    }
}

function getVoice(lang) {
    if (_voices[lang]) {
        return _voices[lang];
    }

    var voices = window.speechSynthesis.getVoices();
    for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang.includes(lang)) {
            _voices[lang] = voices[i];
            return voices[i];
        }
    }
    return null;
}

export {actionService};
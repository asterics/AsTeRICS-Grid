import {dataService} from "./dataService";

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
    }
};

function doActions(gridElement) {
    gridElement.actions.forEach(action => {
        switch (action.modelName) {
            case 'GridActionSpeak':
                log.debug('action speak');
                speak(gridElement.label, action);
                break;
            case 'GridActionNavigate':
                log.debug('action navigate');
                break;
        }
    });
}

function speak(text, action) {
    if (typeof SpeechSynthesisUtterance !== 'undefined') {
        var msg = new SpeechSynthesisUtterance(text);
        msg.voice = getVoice(action.speakLanguage);
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
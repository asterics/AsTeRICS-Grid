import {dataService} from "./dataService";
import {Router} from "./../router";

var _allVoices = null;
var _voicesLangs = [];
var _voicesLangMap = {};
if (typeof SpeechSynthesisUtterance !== 'undefined') {
    _allVoices = window.speechSynthesis.getVoices();
    setTimeout(function () {
        _allVoices = window.speechSynthesis.getVoices(); //first call in chrome returns [] sometimes
        _voicesLangs = _allVoices.map(voice => voice.lang.substring(0,2).toLowerCase());
        _voicesLangs = _voicesLangs.filter(function(item, pos, self) {
            return self.indexOf(item) == pos;
        })
    }, 1000);
}

var actionService = {};

actionService.doAction = function (gridId, gridElementId) {
    dataService.getGridElement(gridId, gridElementId).then(gridElement => {
        log.info('do actions for: ' + gridElement.label);
        doActions(gridElement);
    });
};

actionService.testAction = function (gridElement, action) {
    doAction(gridElement, action);
};

actionService.getVoicesLangs = function () {
    return _voicesLangs;
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
            if(gridElement.label) {
                speak(gridElement.label, action);
            }
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
    if (_voicesLangMap[lang]) {
        return _voicesLangMap[lang];
    }

    for (var i = 0; i < _allVoices.length; i++) {
        if (_allVoices[i].lang.includes(lang)) {
            _voicesLangMap[lang] = _allVoices[i];
            return _allVoices[i];
        }
    }
    return null;
}

export {actionService};
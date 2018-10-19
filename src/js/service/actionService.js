import {dataService} from "./dataService";
import {Router} from "./../router";
import {GridElement} from "./../model/GridElement";

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
        log.info('do actions for: ' + gridElement.label + ', ' + gridElementId);
        switch(gridElement.type) {
            case GridElement.ELEMENT_TYPE_COLLECT: {
                var text = $(`#${gridElementId} textarea`)[0].value;
                speak(text);
                break;
            }
            default: {
                doActions(gridElement);
            }
        }
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
                speak(gridElement.label, action.speakLanguage);
            }
            break;
        case 'GridActionSpeakCustom':
            log.debug('action speak custom');
            if(action.speakText) {
                speak(action.speakText, action.speakLanguage);
            }
            break;
        case 'GridActionNavigate':
            log.debug('action navigate');
            if(Router.isOnEditPage()) {
                Router.toEditGrid(action.toGridId);
            } else {
                Router.toGrid(action.toGridId);
            }
            break;
    }
}

function speak(text, lang) {
    lang = lang || 'en';
    if (typeof SpeechSynthesisUtterance !== 'undefined') {
        var msg = new SpeechSynthesisUtterance(text);
        msg.voice = getVoice(lang);
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
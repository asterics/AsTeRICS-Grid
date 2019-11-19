import {i18nService} from "./i18nService";
import {stateService} from "./stateService";
import {constants} from "../util/constants";
import {dataService} from "./data/dataService";
import {localStorageService} from "./data/localStorageService";

let SPEECH_PREFFERED_VOICE_NAME_KEY = 'SPEECH_PREFFERED_VOICE_NAME_KEY';

var _allVoices = [];
var _voicesLangs = [];
var _voicesLangMap = {};
let _preferredVoiceName = localStorageService.get(SPEECH_PREFFERED_VOICE_NAME_KEY) || '';

var speechService = {};

speechService.speak = function (text, lang, preferredVoiceProp) {
    if (!text) {
        return;
    }
    if (speechService.speechSupported()) {
        lang = lang || i18nService.getBrowserLang();
        window.speechSynthesis.cancel();
        var msg = new SpeechSynthesisUtterance(text);
        msg.voice = preferredVoiceProp || speechService.getPreferredVoice() || getVoice(lang);
        //log.info('used voice: ' + msg.voice.name);
        window.speechSynthesis.speak(msg);
        testIsSpeaking();
        setTimeout(() => { // Firefox takes a while until isSpeaking is true
            testIsSpeaking();
        }, 700);
        function testIsSpeaking() {
            if (speechService.isSpeaking()) {
                stateService.setState(constants.STATE_ACTIVATED_TTS, true);
            }
        }
    }
};

speechService.speakLabel = function (gridId, gridElementId) {
    if (!gridId || !gridElementId) {
        return;
    }
    dataService.getGridElement(gridId, gridElementId).then(gridElement => {
        speechService.speak(gridElement.label);
    });
};

speechService.isSpeaking = function () {
    return window.speechSynthesis.speaking;
};

speechService.getVoicesLangs = function () {
    return _voicesLangs;
};

speechService.getVoices = function () {
    return _allVoices;
};

speechService.setPreferredVoiceName = function(voiceName) {
    _preferredVoiceName = voiceName;
    localStorageService.save(SPEECH_PREFFERED_VOICE_NAME_KEY, voiceName);
};

speechService.getPreferredVoiceName = function() {
    return _preferredVoiceName;
};

speechService.getPreferredVoice = function() {
    if (!_preferredVoiceName) {
        return null;
    }
    return _allVoices.filter(voice => voice.name === _preferredVoiceName)[0];
};

speechService.speechSupported = function () {
    if (typeof SpeechSynthesisUtterance === 'undefined' || !window.speechSynthesis) {
        return false;
    }
    let voices = _allVoices.length > 0 ? _allVoices : window.speechSynthesis.getVoices(); //first call in chrome returns [] sometimes
    voices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    return voices.length > 0;
};

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

function init() {
    if (window.speechSynthesis && window.speechSynthesis.getVoices) {
        _allVoices = window.speechSynthesis.getVoices();
        setTimeout(function () {
            _allVoices = window.speechSynthesis.getVoices(); //first call in chrome returns [] sometimes
            _voicesLangs = _allVoices.map(voice => voice.lang.substring(0,2).toLowerCase());
            _voicesLangs = _voicesLangs.filter(function(item, pos, self) {
                return self.indexOf(item) == pos;
            })
        }, 100);
    }
}
init();

export {speechService};
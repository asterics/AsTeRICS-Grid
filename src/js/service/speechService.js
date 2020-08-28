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

let responsiveVoiceVoices = JSON.parse('[{"name":"UK English Female","lang":"en-GB"},{"name":"UK English Male","lang":"en-GB"},{"name":"US English Female","lang":"en-US"},{"name":"US English Male","lang":"en-US"},{"name":"Arabic Male","lang":"ar-SA"},{"name":"Arabic Female","lang":"ar-SA"},{"name":"Armenian Male","lang":"hy-AM"},{"name":"Australian Female","lang":"en-AU"},{"name":"Australian Male","lang":"en-AU"},{"name":"Bangla Bangladesh Female","lang":"bn-BD"},{"name":"Bangla Bangladesh Male","lang":"bn-BD"},{"name":"Bangla India Female","lang":"bn-IN"},{"name":"Bangla India Male","lang":"bn-IN"},{"name":"Brazilian Portuguese Female","lang":"pt-BR"},{"name":"Chinese Female","lang":"zh-CN"},{"name":"Chinese Male","lang":"zh-CN"},{"name":"Chinese (Hong Kong) Female","lang":"zh-HK"},{"name":"Chinese (Hong Kong) Male","lang":"zh-HK"},{"name":"Chinese Taiwan Female","lang":"zh-TW"},{"name":"Chinese Taiwan Male","lang":"zh-TW"},{"name":"Czech Female","lang":"cs-CZ"},{"name":"Danish Female","lang":"da-DK"},{"name":"Deutsch Female","lang":"de-DE"},{"name":"Deutsch Male","lang":"de-DE"},{"name":"Dutch Female","lang":"nl-NL"},{"name":"Dutch Male","lang":"nl-NL"},{"name":"Estonian Male","lang":"et-EE"},{"name":"Filipino Female","lang":"fil-PH"},{"name":"Finnish Female","lang":"fi-FI"},{"name":"French Female","lang":"fr-FR"},{"name":"French Male","lang":"fr-FR"},{"name":"French Canadian Female","lang":"fr-CA"},{"name":"French Canadian Male","lang":"fr-CA"},{"name":"Greek Female","lang":"el-GR"},{"name":"Hindi Female","lang":"hi-IN"},{"name":"Hindi Male","lang":"hi-IN"},{"name":"Hungarian Female","lang":"hu-HU"},{"name":"Indonesian Female","lang":"id-ID"},{"name":"Indonesian Male","lang":"id-ID"},{"name":"Italian Female","lang":"it-IT"},{"name":"Italian Male","lang":"it-IT"},{"name":"Japanese Female","lang":"ja-JP"},{"name":"Japanese Male","lang":"ja-JP"},{"name":"Korean Female","lang":"ko-KR"},{"name":"Korean Male","lang":"ko-KR"},{"name":"Latin Male","lang":"la"},{"name":"Nepali","lang":"ne-NP"},{"name":"Norwegian Female","lang":"nb-NO"},{"name":"Norwegian Male","lang":"nb-NO"},{"name":"Polish Female","lang":"pl-PL"},{"name":"Polish Male","lang":"pl-PL"},{"name":"Portuguese Female","lang":"pt-BR"},{"name":"Portuguese Male","lang":"pt-BR"},{"name":"Romanian Female","lang":"ro-RO"},{"name":"Russian Female","lang":"ru-RU"},{"name":"Sinhala","lang":"si-LK"},{"name":"Slovak Female","lang":"sk-SK"},{"name":"Spanish Female","lang":"es-ES"},{"name":"Spanish Latin American Female","lang":"es-MX"},{"name":"Spanish Latin American Male","lang":"es-MX"},{"name":"Swedish Female","lang":"sv-SE"},{"name":"Swedish Male","lang":"sv-SE"},{"name":"Tamil Female","lang":"hi-IN"},{"name":"Tamil Male","lang":"hi-IN"},{"name":"Thai Female","lang":"th-TH"},{"name":"Thai Male","lang":"th-TH"},{"name":"Turkish Female","lang":"tr-TR"},{"name":"Turkish Male","lang":"tr-TR"},{"name":"Ukrainian Female","lang":"uk-UA"},{"name":"Vietnamese Female","lang":"vi-VN"},{"name":"Vietnamese Male","lang":"vi-VN"},{"name":"Afrikaans Male","lang":"af-ZA"},{"name":"Albanian Male","lang":"sq-AL"},{"name":"Bosnian Male","lang":"bs"},{"name":"Catalan Male","lang":"ca-ES"},{"name":"Croatian Male","lang":"hr-HR"},{"name":"Esperanto Male","lang":"eo"},{"name":"Icelandic Male","lang":"is-IS"},{"name":"Latvian Male","lang":"lv-LV"},{"name":"Macedonian Male","lang":"mk-MK"},{"name":"Moldavian Female","lang":"md"},{"name":"Montenegrin Male","lang":"me"},{"name":"Serbian Male","lang":"sr-RS"},{"name":"Serbo-Croatian Male","lang":"hr-HR"},{"name":"Swahili Male","lang":"sw-KE"},{"name":"Welsh Male","lang":"cy"},{"name":"Fallback UK Female","lang":"en-GB"}]');

var speechService = {};

speechService.speak = function (text, lang, preferredVoiceProp) {
    if (!text) {
        return;
    }
    speechService.stopSpeaking();
    lang = lang || i18nService.getBrowserLang();
    let voice = preferredVoiceProp || speechService.getPreferredVoice() || getVoice(lang);
    if (speechService.nativeSpeechSupported() && voice) {
        var msg = new SpeechSynthesisUtterance(text);
        msg.voice = voice;
        log.debug('used voice: ' + msg.voice.name);
        window.speechSynthesis.speak(msg);
    } else {
        let voicelist = responsiveVoiceVoices.filter(v => v.lang.substring(0,2).toLowerCase() === lang);
        responsiveVoice.speak(text, voicelist[0].name);
    }
    testIsSpeaking();
    setTimeout(() => { // Firefox takes a while until isSpeaking is true
        testIsSpeaking();
    }, 700);
    function testIsSpeaking() {
        if (speechService.isSpeaking()) {
            stateService.setState(constants.STATE_ACTIVATED_TTS, true);
        }
    }
};

speechService.speakLabel = function (gridId, gridElementId) {
    if (!gridId || !gridElementId) {
        return;
    }
    dataService.getGridElement(gridId, gridElementId).then(gridElement => {
        speechService.speak(i18nService.getTranslation(gridElement.label));
    });
};

speechService.stopSpeaking = function () {
    if (speechService.nativeSpeechSupported()) {
        window.speechSynthesis.cancel();
    }
    responsiveVoice.cancel();
};

speechService.isSpeaking = function () {
    return window.speechSynthesis.speaking || responsiveVoice.isPlaying();
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

speechService.nativeSpeechSupported = function () {
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
import {i18nService} from "./i18nService";
import {stateService} from "./stateService";
import {constants} from "../util/constants";
import {dataService} from "./data/dataService";
import {localStorageService} from "./data/localStorageService";

let speechService = {};

let SPEECH_PREFFERED_VOICE_NAME_KEY = 'SPEECH_PREFFERED_VOICE_NAME_KEY';
speechService.VOICE_TYPE_NATIVE = 'VOICE_TYPE_NATIVE';
speechService.VOICE_TYPE_RESPONSIVEVOICE = 'VOICE_TYPE_RESPONSIVEVOICE';

var _allVoicesNative = [];
let _preferredVoiceName = localStorageService.get(SPEECH_PREFFERED_VOICE_NAME_KEY) || '';
let allVoices = [];
let responsiveVoiceVoices = JSON.parse('[{"name":"UK English Female","lang":"en-GB"},{"name":"UK English Male","lang":"en-GB"},{"name":"US English Female","lang":"en-US"},{"name":"US English Male","lang":"en-US"},{"name":"Arabic Male","lang":"ar-SA"},{"name":"Arabic Female","lang":"ar-SA"},{"name":"Armenian Male","lang":"hy-AM"},{"name":"Australian Female","lang":"en-AU"},{"name":"Australian Male","lang":"en-AU"},{"name":"Bangla Bangladesh Female","lang":"bn-BD"},{"name":"Bangla Bangladesh Male","lang":"bn-BD"},{"name":"Bangla India Female","lang":"bn-IN"},{"name":"Bangla India Male","lang":"bn-IN"},{"name":"Brazilian Portuguese Female","lang":"pt-BR"},{"name":"Chinese Female","lang":"zh-CN"},{"name":"Chinese Male","lang":"zh-CN"},{"name":"Chinese (Hong Kong) Female","lang":"zh-HK"},{"name":"Chinese (Hong Kong) Male","lang":"zh-HK"},{"name":"Chinese Taiwan Female","lang":"zh-TW"},{"name":"Chinese Taiwan Male","lang":"zh-TW"},{"name":"Czech Female","lang":"cs-CZ"},{"name":"Danish Female","lang":"da-DK"},{"name":"Deutsch Female","lang":"de-DE"},{"name":"Deutsch Male","lang":"de-DE"},{"name":"Dutch Female","lang":"nl-NL"},{"name":"Dutch Male","lang":"nl-NL"},{"name":"Estonian Male","lang":"et-EE"},{"name":"Filipino Female","lang":"fil-PH"},{"name":"Finnish Female","lang":"fi-FI"},{"name":"French Female","lang":"fr-FR"},{"name":"French Male","lang":"fr-FR"},{"name":"French Canadian Female","lang":"fr-CA"},{"name":"French Canadian Male","lang":"fr-CA"},{"name":"Greek Female","lang":"el-GR"},{"name":"Hindi Female","lang":"hi-IN"},{"name":"Hindi Male","lang":"hi-IN"},{"name":"Hungarian Female","lang":"hu-HU"},{"name":"Indonesian Female","lang":"id-ID"},{"name":"Indonesian Male","lang":"id-ID"},{"name":"Italian Female","lang":"it-IT"},{"name":"Italian Male","lang":"it-IT"},{"name":"Japanese Female","lang":"ja-JP"},{"name":"Japanese Male","lang":"ja-JP"},{"name":"Korean Female","lang":"ko-KR"},{"name":"Korean Male","lang":"ko-KR"},{"name":"Latin Male","lang":"la"},{"name":"Nepali","lang":"ne-NP"},{"name":"Norwegian Female","lang":"nb-NO"},{"name":"Norwegian Male","lang":"nb-NO"},{"name":"Polish Female","lang":"pl-PL"},{"name":"Polish Male","lang":"pl-PL"},{"name":"Portuguese Female","lang":"pt-BR"},{"name":"Portuguese Male","lang":"pt-BR"},{"name":"Romanian Female","lang":"ro-RO"},{"name":"Russian Female","lang":"ru-RU"},{"name":"Sinhala","lang":"si-LK"},{"name":"Slovak Female","lang":"sk-SK"},{"name":"Spanish Female","lang":"es-ES"},{"name":"Spanish Latin American Female","lang":"es-MX"},{"name":"Spanish Latin American Male","lang":"es-MX"},{"name":"Swedish Female","lang":"sv-SE"},{"name":"Swedish Male","lang":"sv-SE"},{"name":"Tamil Female","lang":"hi-IN"},{"name":"Tamil Male","lang":"hi-IN"},{"name":"Thai Female","lang":"th-TH"},{"name":"Thai Male","lang":"th-TH"},{"name":"Turkish Female","lang":"tr-TR"},{"name":"Turkish Male","lang":"tr-TR"},{"name":"Ukrainian Female","lang":"uk-UA"},{"name":"Vietnamese Female","lang":"vi-VN"},{"name":"Vietnamese Male","lang":"vi-VN"},{"name":"Afrikaans Male","lang":"af-ZA"},{"name":"Albanian Male","lang":"sq-AL"},{"name":"Bosnian Male","lang":"bs"},{"name":"Catalan Male","lang":"ca-ES"},{"name":"Croatian Male","lang":"hr-HR"},{"name":"Esperanto Male","lang":"eo"},{"name":"Icelandic Male","lang":"is-IS"},{"name":"Latvian Male","lang":"lv-LV"},{"name":"Macedonian Male","lang":"mk-MK"},{"name":"Moldavian Female","lang":"md"},{"name":"Montenegrin Male","lang":"me"},{"name":"Serbian Male","lang":"sr-RS"},{"name":"Serbo-Croatian Male","lang":"hr-HR"},{"name":"Swahili Male","lang":"sw-KE"},{"name":"Welsh Male","lang":"cy"},{"name":"Fallback UK Female","lang":"en-GB"}]');

/**
 * speaks given text.
 * Voice to use is determined by the following procedure:
 * 1) use voice with name of "preferredVoiceProp", (if set)
 * 2) use voice with name of saved "_preferredVoiceName" from local storage, (if set)
 * 3) use any voice by language, from property "lang" (if set)
 * 4) if nothing set: use voice by language, language determined by current browser language
 *
 * If "textOrObject" is an translation object and it contains a translation with the same language as the voice from
 * saved "_preferredVoiceName", the translation to use will be determined by the language of this voice. E.g. if the
 * preferred voice is "Google German" the german translation of the translation object "textOrObject" will be spoken.
 *
 * @param textOrOject string to speak, or translation object containing all translations
 * @param lang (optional) language code of preferred voice to use to speak
 * @param preferredVoiceProp (optional) voice name that should be used for speaking
 */
speechService.speak = function (textOrOject, lang, preferredVoiceProp) {
    let text = null;
    let isString = typeof textOrOject === 'string';
    if (!textOrOject || (!isString && Object.keys(textOrOject).length === 0)) {
        return;
    }
    if (isString) {
        text = textOrOject;
    } else {
        lang = getVoiceLang(_preferredVoiceName) || lang;
        let translation = textOrOject[lang] || i18nService.getTranslation(textOrOject, null, true);
        text = translation.text !== undefined ? translation.text : translation;
        lang = lang || translation.lang;
    }
    speechService.stopSpeaking();
    lang = lang || i18nService.getBrowserLang();
    let voices = getVoicesByName(preferredVoiceProp) || getVoicesByName(_preferredVoiceName) || getVoicesByLang(lang);
    let nativeVoices = voices.filter(voice => voice.type === speechService.VOICE_TYPE_NATIVE);
    let responsiveVoices = voices.filter(voice => voice.type === speechService.VOICE_TYPE_RESPONSIVEVOICE);
    if (speechService.nativeSpeechSupported() && nativeVoices.length > 0) {
        var msg = new SpeechSynthesisUtterance(text);
        msg.voice = nativeVoices[0].ref;
        log.debug('used voice: ' + msg.voice.name);
        window.speechSynthesis.speak(msg);
    } else if(responsiveVoices.length > 0) {
        responsiveVoice.speak(text, responsiveVoices[0].name);
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
    return (speechService.nativeSpeechSupported() && window.speechSynthesis.speaking) || responsiveVoice.isPlaying();
};

/**
 * returns array of languages where a TTS voice exists
 * @return {*} array of languages where one element has properties [en, de, code].
 */
speechService.getVoicesLangs = function () {
    let voiceLangCodes = allVoices.map(voice => voice.lang.substring(0, 2));
    return i18nService.getAllLanguages().filter(lang => voiceLangCodes.indexOf(lang.code) !== -1);
};

/**
 * returns array of all voices where one element has properties [name, lang, type, ref]
 * @return {[]}
 */
speechService.getVoices = function () {
    return allVoices;
};

speechService.setPreferredVoiceName = function(voiceName) {
    _preferredVoiceName = voiceName;
    localStorageService.save(SPEECH_PREFFERED_VOICE_NAME_KEY, voiceName);
};

speechService.getPreferredVoiceName = function() {
    return _preferredVoiceName;
};

/**
 * checks if native speech is supported.
 * @return {boolean} true, if speech synthesis is supported by the browser
 */
speechService.nativeSpeechSupported = function () {
    return !!(typeof SpeechSynthesisUtterance !== 'undefined' && window.speechSynthesis && window.speechSynthesis.getVoices);
};

function getVoicesByLang(lang) {
    return allVoices.filter(voice => voice.lang.substring(0,2) === lang);
}

/**
 * returns a list of voices by name
 * @param voiceName the voice name to search
 * @return {*[]|null} a list of voices with this name, or null if not found
 */
function getVoicesByName(voiceName) {
    let voices = allVoices.filter(voice => voice.name === voiceName);
    return voices.length > 0 ? voices : null;
}

function getVoiceLang(voiceName) {
    let voices = getVoicesByName(voiceName);
    return voices && voices[0] ? voices[0].lang : null;
}

function addVoice(voiceName, voiceLang, voiceType, voiceReference) {
    if (allVoices.map(voice => voice.name).indexOf(voiceName) !== -1) {
        return;
    }
    allVoices.push({
        name: voiceName,
        lang: voiceLang.substring(0, 2),
        type: voiceType,
        ref: voiceReference
    });
}

function sortVoices() {
    allVoices.sort((l1, l2) => {
        if (l1.type === speechService.VOICE_TYPE_NATIVE && l1.type !== l2.type) {
            return -1;
        }
        if (l2.type === speechService.VOICE_TYPE_NATIVE && l1.type !== l2.type) {
            return 1;
        }
        return l1.name.localeCompare(l2.name);
    });
}

function init() {
    if (speechService.nativeSpeechSupported()) {
        _allVoicesNative = window.speechSynthesis.getVoices();
        setTimeout(function () {
            _allVoicesNative = window.speechSynthesis.getVoices(); //first call in chrome returns [] sometimes
            _allVoicesNative.forEach(voice => {
                addVoice(voice.name, voice.lang, speechService.VOICE_TYPE_NATIVE, voice);
            })
            sortVoices();
        }, 100);
    }
    responsiveVoiceVoices.forEach(voice => {
        addVoice(voice.name, voice.lang, speechService.VOICE_TYPE_RESPONSIVEVOICE);
    })
    sortVoices();
}
init();

export {speechService};
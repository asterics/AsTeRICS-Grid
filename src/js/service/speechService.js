import { i18nService } from './i18nService';
import { stateService } from './stateService';
import { constants } from '../util/constants';
import { dataService } from './data/dataService';
import { util } from '../util/util.js';
import $ from '../externals/jquery.js';
import {audioUtil} from "../util/audioUtil.js";

let speechService = {};

speechService.VOICE_TYPE_NATIVE = 'VOICE_TYPE_NATIVE';
speechService.VOICE_TYPE_RESPONSIVEVOICE = 'VOICE_TYPE_RESPONSIVEVOICE';

let _preferredVoiceId = null;
let _secondVoiceId = null;
let _voicePitch = 1;
let _voiceRate = 1;
let _voiceLangIsTextLang = false;
let allVoices = [];
let responsiveVoiceVoices = JSON.parse(
    '[{"name":"UK English Female","lang":"en-GB"},{"name":"UK English Male","lang":"en-GB"},{"name":"US English Female","lang":"en-US"},{"name":"US English Male","lang":"en-US"},{"name":"Arabic Male","lang":"ar-SA"},{"name":"Arabic Female","lang":"ar-SA"},{"name":"Armenian Male","lang":"hy-AM"},{"name":"Australian Female","lang":"en-AU"},{"name":"Australian Male","lang":"en-AU"},{"name":"Bangla Bangladesh Female","lang":"bn-BD"},{"name":"Bangla Bangladesh Male","lang":"bn-BD"},{"name":"Bangla India Female","lang":"bn-IN"},{"name":"Bangla India Male","lang":"bn-IN"},{"name":"Brazilian Portuguese Female","lang":"pt-BR"},{"name":"Chinese Female","lang":"zh-CN"},{"name":"Chinese Male","lang":"zh-CN"},{"name":"Chinese (Hong Kong) Female","lang":"zh-HK"},{"name":"Chinese (Hong Kong) Male","lang":"zh-HK"},{"name":"Chinese Taiwan Female","lang":"zh-TW"},{"name":"Chinese Taiwan Male","lang":"zh-TW"},{"name":"Czech Female","lang":"cs-CZ"},{"name":"Danish Female","lang":"da-DK"},{"name":"Deutsch Female","lang":"de-DE"},{"name":"Deutsch Male","lang":"de-DE"},{"name":"Dutch Female","lang":"nl-NL"},{"name":"Dutch Male","lang":"nl-NL"},{"name":"Estonian Male","lang":"et-EE"},{"name":"Filipino Female","lang":"fil-PH"},{"name":"Finnish Female","lang":"fi-FI"},{"name":"French Female","lang":"fr-FR"},{"name":"French Male","lang":"fr-FR"},{"name":"French Canadian Female","lang":"fr-CA"},{"name":"French Canadian Male","lang":"fr-CA"},{"name":"Greek Female","lang":"el-GR"},{"name":"Hindi Female","lang":"hi-IN"},{"name":"Hindi Male","lang":"hi-IN"},{"name":"Hungarian Female","lang":"hu-HU"},{"name":"Indonesian Female","lang":"id-ID"},{"name":"Indonesian Male","lang":"id-ID"},{"name":"Italian Female","lang":"it-IT"},{"name":"Italian Male","lang":"it-IT"},{"name":"Japanese Female","lang":"ja-JP"},{"name":"Japanese Male","lang":"ja-JP"},{"name":"Korean Female","lang":"ko-KR"},{"name":"Korean Male","lang":"ko-KR"},{"name":"Latin Male","lang":"la"},{"name":"Nepali","lang":"ne-NP"},{"name":"Norwegian Female","lang":"nb-NO"},{"name":"Norwegian Male","lang":"nb-NO"},{"name":"Polish Female","lang":"pl-PL"},{"name":"Polish Male","lang":"pl-PL"},{"name":"Portuguese Female","lang":"pt-BR"},{"name":"Portuguese Male","lang":"pt-BR"},{"name":"Romanian Female","lang":"ro-RO"},{"name":"Russian Female","lang":"ru-RU"},{"name":"Sinhala","lang":"si-LK"},{"name":"Slovak Female","lang":"sk-SK"},{"name":"Spanish Female","lang":"es-ES"},{"name":"Spanish Latin American Female","lang":"es-MX"},{"name":"Spanish Latin American Male","lang":"es-MX"},{"name":"Swedish Female","lang":"sv-SE"},{"name":"Swedish Male","lang":"sv-SE"},{"name":"Tamil Female","lang":"hi-IN"},{"name":"Tamil Male","lang":"hi-IN"},{"name":"Thai Female","lang":"th-TH"},{"name":"Thai Male","lang":"th-TH"},{"name":"Turkish Female","lang":"tr-TR"},{"name":"Turkish Male","lang":"tr-TR"},{"name":"Ukrainian Female","lang":"uk-UA"},{"name":"Vietnamese Female","lang":"vi-VN"},{"name":"Vietnamese Male","lang":"vi-VN"},{"name":"Afrikaans Male","lang":"af-ZA"},{"name":"Albanian Male","lang":"sq-AL"},{"name":"Bosnian Male","lang":"bs"},{"name":"Catalan Male","lang":"ca-ES"},{"name":"Croatian Male","lang":"hr-HR"},{"name":"Esperanto Male","lang":"eo"},{"name":"Icelandic Male","lang":"is-IS"},{"name":"Latvian Male","lang":"lv-LV"},{"name":"Macedonian Male","lang":"mk-MK"},{"name":"Moldavian Female","lang":"md"},{"name":"Montenegrin Male","lang":"me"},{"name":"Serbian Male","lang":"sr-RS"},{"name":"Serbo-Croatian Male","lang":"hr-HR"},{"name":"Swahili Male","lang":"sw-KE"},{"name":"Welsh Male","lang":"cy"},{"name":"Fallback UK Female","lang":"en-GB"}]'
);
let currentSpeakArray = [];
let lastSpeakText = null;
let lastSpeakTime = 0;
let voiceIgnoreList = ['com.apple.speech.synthesis.voice']; //joke voices by Apple
let voiceSortBackList = ['com.apple.eloquence'];
let hasSpoken = false;

let _waitingSpeakOptions = {};

/**
 * speaks given text.
 * Voice to use is determined by the following procedure:
 * 1) use voice with name of "preferredVoice", (if set)
 * 2) use voice with name of saved "_preferredVoiceId" from local storage, (if set)
 * 3) use any voice by language, from property "lang" (if set)
 * 4) if nothing set: use voice by language, language determined by current browser language
 *
 * If "textOrObject" is an translation object and it contains a translation with the same language as the voice from
 * saved "_preferredVoiceId", the translation to use will be determined by the language of this voice. E.g. if the
 * preferred voice is "Google German" the german translation of the translation object "textOrObject" will be spoken.
 *
 * @param textOrOject string to speak, or translation object containing all translations
 * @param options.lang (optional) language code of preferred voice to use to speak
 * @param options.preferredVoice (optional) voice id that should be used for speaking
 * @param options.voiceLangIsTextLang (optional) if true and a preferred voice is set, the language of this voice is
 *                                      used as content language to speak
 * @param options.dontStop (optional) if true, currently spoken text isn't aborted
 * @param options.speakSecondary (optional) if true, spoken text is repeated using the secondary language
 * @param options.useStandardRatePitch (optional) if true, the standard values for rate/pitch are used (1)
 * @param options.rate (optional) rate value to use
 * @param options.minEqualPause (optional) minimum pause between 2 times speaking the same text
 * @param options.progressFn (optional) function where boundary events of the spoken phrase are sent to
 */
speechService.speak = function (textOrOject, options) {
    options = options || {};
    options.voiceLangIsTextLang = options.voiceLangIsTextLang || _voiceLangIsTextLang;
    let text = null;
    let isString = typeof textOrOject === 'string';
    if (!textOrOject || (!isString && Object.keys(textOrOject).length === 0)) {
        return;
    }

    let preferredVoiceId = options.preferredVoice || _preferredVoiceId;
    let prefVoiceLang = getVoiceLang(preferredVoiceId);
    let alternativeLang = options.voiceLangIsTextLang && prefVoiceLang ? prefVoiceLang : i18nService.getContentLang();
    let langToUse = options.lang || alternativeLang;
    if (isString) {
        text = textOrOject;
    } else {
        text = textOrOject[langToUse];
        if (
            options.voiceLangIsTextLang &&
            preferredVoiceId &&
            prefVoiceLang !== langToUse &&
            getVoicesByLang(langToUse)
        ) {
            preferredVoiceId = null; // use auto voice for language
        }
    }
    if (!text) {
        return;
    }
    text = text.toLowerCase();
    if (text === lastSpeakText && new Date().getTime() - lastSpeakTime < options.minEqualPause) {
        return;
    }
    lastSpeakText = text;
    lastSpeakTime = new Date().getTime();
    if (!options.dontStop) {
        speechService.stopSpeaking();
    }
    let voices = getVoicesById(preferredVoiceId) || getVoicesByLang(langToUse);
    let nativeVoices = voices.filter((voice) => voice.type === speechService.VOICE_TYPE_NATIVE);
    let responsiveVoices = voices.filter((voice) => voice.type === speechService.VOICE_TYPE_RESPONSIVEVOICE);
    if (speechService.nativeSpeechSupported() && nativeVoices.length > 0) {
        var msg = new SpeechSynthesisUtterance(text);
        msg.voice = nativeVoices[0].ref;
        let isSelectedVoice = nativeVoices[0].id === preferredVoiceId;
        msg.pitch = isSelectedVoice && !options.useStandardRatePitch ? _voicePitch : 1;
        msg.rate = options.rate || (isSelectedVoice && !options.useStandardRatePitch ? _voiceRate : 1);
        if (options.progressFn) {
            msg.addEventListener('boundary', options.progressFn);
            msg.addEventListener('end', options.progressFn);
        }
        window.speechSynthesis.speak(msg);
        msg.addEventListener('start', () => {
            hasSpoken = true;
        });
    } else if (responsiveVoices.length > 0) {
        let isSelectedVoice = responsiveVoices[0].id === preferredVoiceId;
        responsiveVoice.speak(text, responsiveVoices[0].name, {
            rate: options.rate || (isSelectedVoice && !options.useStandardRatePitch ? _voiceRate : 1),
            pitch: isSelectedVoice && !options.useStandardRatePitch ? _voicePitch : 1
        });
        hasSpoken = true;
    }
    testIsSpeaking();
    setTimeout(() => {
        // Firefox takes a while until isSpeaking is true
        testIsSpeaking();
    }, 700);
    function testIsSpeaking() {
        if (speechService.isSpeaking()) {
            stateService.setState(constants.STATE_ACTIVATED_TTS, true);
        }
    }
    if (_secondVoiceId && options.speakSecondary) {
        speechService.speakAfterFinished(textOrOject, {
            preferredVoice: _secondVoiceId,
            useStandardRatePitch: true,
            voiceLangIsTextLang: true
        });
    }
};

speechService.speakAfterFinished = function (txtOrObject, options) {
    _waitingSpeakOptions.txtOrObject = txtOrObject;
    _waitingSpeakOptions.options = options;
    if (!_waitingSpeakOptions.waiting) {
        _waitingSpeakOptions.waiting = true;
        speechService.doAfterFinishedSpeaking(() => {
            speechService.speak(_waitingSpeakOptions.txtOrObject, _waitingSpeakOptions.options);
            _waitingSpeakOptions.waiting = false;
            _waitingSpeakOptions.txtOrObject = '';
            _waitingSpeakOptions.options = undefined;
        })
    }
}

/**
 * speaks an array of speak-elements one after each other
 * @param array array of elements, where an element can be an object {text: "text-to-speak-tts"}
 *              or {base64Sound: "base64Data"} containing binary data to play as sound
 * @param progressFn
 * @param index
 * @return {Promise<void>}
 */
speechService.speakArray = async function (array, progressFn, index) {
    if (speechService.isSpeaking()) {
        speechService.stopSpeaking();
    }
    index = index || 0;
    progressFn = progressFn || (() => {});
    array = JSON.parse(JSON.stringify(array));
    if (!array || array.length === 0) {
        progressFn(null, true);
        return;
    }
    progressFn(index);
    currentSpeakArray = JSON.parse(JSON.stringify(array));
    let object = currentSpeakArray.shift();
    if (object.text) {
        speechService.speak(object.text, { dontStop: true });
        await speechService.waitForFinishedSpeaking();
    } else if (object.base64Sound) {
        await audioUtil.playAudio(object.base64Sound);
        await audioUtil.waitForAudioEnded();
    }
    speechService.speakArray(currentSpeakArray, progressFn, index + 1);
};

speechService.stopSpeaking = function () {
    currentSpeakArray = [];
    if (speechService.nativeSpeechSupported()) {
        window.speechSynthesis.cancel();
    }
    responsiveVoice.cancel();
};

speechService.isSpeaking = function () {
    return (speechService.nativeSpeechSupported() && window.speechSynthesis.speaking) || responsiveVoice.isPlaying();
};

speechService.doAfterFinishedSpeaking = async function (fn) {
    await speechService.waitForFinishedSpeaking();
    fn = fn || (() => {});
    fn();
};

speechService.waitForFinishedSpeaking = async function () {
    let maxWait = 10000;
    let wait = 0;
    while (!speechService.isSpeaking() && wait < maxWait) {
        // wait until speak starting (responsive voice)
        wait += 100;
        await util.sleep(100);
    }
    let promise = new Promise((resolve) => {
        let intervalHandler = setInterval(() => {
            if (!speechService.isSpeaking()) {
                clearInterval(intervalHandler);
                resolve();
            }
        }, 50);
    });
    await promise;
};

speechService.testSpeak = function (voiceName, testSentence, testLang) {
    if (!voiceName) {
        return;
    }
    let voiceLang = speechService.getVoices().filter((lang) => lang.name === voiceName)[0].lang;
    testLang = testLang || voiceLang;
    testSentence = testSentence || i18nService.tl('thisIsAnEnglishSentence', null, testLang);
    speechService.speak(testSentence, {
        preferredVoice: voiceName,
        useStandardRatePitch: true
    });
};

/**
 * returns array of languages where a TTS voice exists
 * @return {*} array of languages where one element has properties [en, de, code].
 */
speechService.getVoicesLangs = function () {
    let voiceLangCodes = allVoices.map((voice) => voice.lang.substring(0, 2));
    return i18nService.getAllLanguages().filter((lang) => voiceLangCodes.indexOf(lang.code) !== -1);
};

/**
 * returns array of all voices where one element has properties [name, lang, type, ref]
 * @return {[]}
 */
speechService.getVoices = function () {
    allVoices.sort(speechService.voiceSortFn);
    return allVoices;
};

speechService.voiceSortFn = function (a, b) {
    if (a.lang !== b.lang) {
        return i18nService.t(`lang.${a.lang}`).localeCompare(i18nService.t(`lang.${b.lang}`));
    }
    if (a.type !== b.type) {
        if (a.type === speechService.VOICE_TYPE_NATIVE) return -1;
        if (b.type === speechService.VOICE_TYPE_NATIVE) return 1;
    }
    if (a.local !== b.local) {
        if (a.local) return -1;
        if (b.local) return 1;
    }
    let aSortBack = voiceSortBackList.some((id) => a.id.toLowerCase().includes(id.toLowerCase()));
    let bSortBack = voiceSortBackList.some((id) => b.id.toLowerCase().includes(id.toLowerCase()));
    if (aSortBack && !bSortBack) {
        return 1;
    } else if (!aSortBack && bSortBack) {
        return -1;
    }
    return a.name.localeCompare(b.name);
};

/**
 * checks if native speech is supported.
 * @return {boolean} true, if speech synthesis is supported by the browser
 */
speechService.nativeSpeechSupported = function () {
    return !!(
        typeof SpeechSynthesisUtterance !== 'undefined' &&
        window.speechSynthesis &&
        window.speechSynthesis.getVoices
    );
};

speechService.getPreferredVoiceLang = function () {
    return getVoiceLang(_preferredVoiceId);
};

speechService.isVoiceLangLinkedToTextLang = function () {
    return _voiceLangIsTextLang;
};

speechService.hasSpoken = function () {
    return hasSpoken;
}

function getVoicesByLang(lang) {
    return allVoices.filter((voice) => voice.lang.substring(0, 2) === lang);
}

/**
 * returns a list of voices by name
 * @param voiceId the voice id to search
 * @return {*[]|null} a list of voices with this name, or null if not found
 */
function getVoicesById(voiceId) {
    let voices = allVoices.filter((voice) => voice.id === voiceId);
    if (voices.length === 0) {
        //fallback for data created before inventing ID
        voices = allVoices.filter((voice) => voice.name === voiceId);
    }
    return voices.length > 0 ? voices : null;
}

function getVoiceLang(voiceId) {
    let voices = getVoicesById(voiceId);
    return voices && voices[0] ? voices[0].lang : null;
}

function addVoice(voiceName, voiceLang, voiceType, voiceReference) {
    let id = voiceReference ? voiceReference.voiceURI : voiceName;
    if (voiceIgnoreList.some((ignore) => id.includes(ignore))) {
        return;
    }
    if (allVoices.map((voice) => voice.id).indexOf(id) !== -1) {
        return;
    }
    let existingNameIndex = allVoices.map((voice) => voice.name).indexOf(voiceName);
    if (existingNameIndex !== -1) {
        voiceName = `${voiceName} (${voiceLang})`;
        let existingVoice = allVoices[existingNameIndex];
        existingVoice.name = `${existingVoice.name} (${existingVoice.langFull})`;
    }
    allVoices.push({
        id: id,
        name: voiceName,
        lang: voiceLang.substring(0, 2).toLowerCase(),
        langFull: voiceLang,
        type: voiceType,
        ref: voiceReference,
        local: voiceReference && voiceReference.localService ? true : false
    });
}

async function registerVoices(arrayNativeVoices) {
    arrayNativeVoices.forEach((voice) => {
        addVoice(voice.name, voice.lang, speechService.VOICE_TYPE_NATIVE, voice);
    });
}

async function init() {
    if (speechService.nativeSpeechSupported()) {
        await registerVoices(window.speechSynthesis.getVoices());
        window.speechSynthesis.onvoiceschanged = function () {
            registerVoices(window.speechSynthesis.getVoices());
        };
    }
    responsiveVoiceVoices.forEach((voice) => {
        addVoice(voice.name, voice.lang, speechService.VOICE_TYPE_RESPONSIVEVOICE);
    });
}
init();

function updateMetadataConfig(event, metadata) {
    _preferredVoiceId = metadata.localeConfig.preferredVoice || null;
    _voicePitch = metadata.localeConfig.voicePitch || 1;
    _voiceRate = metadata.localeConfig.voiceRate || 1;
    _secondVoiceId = metadata.localeConfig.secondVoice || null;
    _voiceLangIsTextLang = metadata.localeConfig.voiceLangIsTextLang || false;
}

$(document).on(constants.EVENT_USER_CHANGED, async () => {
    let metadata = await dataService.getMetadata();
    updateMetadataConfig(null, metadata);
});
$(document).on(constants.EVENT_METADATA_UPDATED, updateMetadataConfig);

export { speechService };

import { stateService } from '../stateService';
import { constants } from '../../util/constants';
import { util } from '../../util/util.js';
import $ from '../../externals/jquery.js';
import { audioUtil } from '../../util/audioUtil.js';
import { speechServiceExternal } from './speechServiceExternal.js';
import { localStorageService } from '../data/localStorageService.js';
import { i18nService } from '../i18nService';
import { speechServiceAzure } from './speechServiceAzure';

let speechService = {};

let _preferredVoiceId = null;
let _secondVoiceId = null;
let _voicePitch = 1;
let _voiceRate = 1;
let _voiceLangIsTextLang = false;
let allVoices = [];

let currentSpeakArray = [];
let lastSpeakText = null;
let lastSpeakTime = 0;
let voiceIgnoreList = ['com.apple.speech.synthesis.voice']; //joke voices by Apple
let voiceSortBackList = ['com.apple.eloquence'];
let hasSpoken = false;
let isSpeakingNative = false;

let _initPromiseResolveFn;
let initPromise = new Promise(resolve => {
    _initPromiseResolveFn = resolve;
});

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
 * @param options (optional) options
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
speechService.speak = function (textOrOject, options = {}) {
    options = options || {};
    options.voiceLangIsTextLang = options.voiceLangIsTextLang || _voiceLangIsTextLang;
    let userSettings = localStorageService.getUserSettings();
    let text = null;
    let isString = typeof textOrOject === 'string';
    if (!textOrOject || (!isString && Object.keys(textOrOject).length === 0)) {
        return;
    }
    if (userSettings.systemVolume === 0 || userSettings.systemVolumeMuted) {
        return;
    }
    speechService.resetSpeakAfterFinished();

    let preferredVoiceId = options.preferredVoice || _preferredVoiceId;
    let prefVoiceLang = speechService.getVoiceLang(preferredVoiceId);
    let alternativeLang = options.voiceLangIsTextLang && prefVoiceLang ? prefVoiceLang : i18nService.getContentLang();
    let langToUse = options.lang || alternativeLang;
    if (isString) {
        text = textOrOject;
    } else {
        text = i18nService.getTranslation(textOrOject, { lang: langToUse });
    }
    if (!text) {
        return;
    }
    if (options.voiceLangIsTextLang &&
        preferredVoiceId &&
        i18nService.getBaseLang(prefVoiceLang) !== i18nService.getBaseLang(langToUse) &&
        getVoicesByLang(langToUse).length > 0
    ) {
        preferredVoiceId = null; // use auto voice for language
    }
    if (text === lastSpeakText && new Date().getTime() - lastSpeakTime < options.minEqualPause) {
        return;
    }
    $(document).trigger(constants.EVENT_SPEAKING_TEXT, [text]);
    lastSpeakText = text;
    lastSpeakTime = new Date().getTime();
    if (!options.dontStop) {
        speechService.stopSpeaking();
    }
    let voices = getVoicesById(preferredVoiceId) || getVoicesByLang(langToUse);
    let nativeVoices = voices.filter((voice) => voice.type === constants.VOICE_TYPE_NATIVE);
    let azureVoices = voices.filter((voice) => voice.type === constants.VOICE_TYPE_MS_AZURE);
    let externalVoices = voices.filter((voice) => voice.type === constants.VOICE_TYPE_EXTERNAL_PLAYING || voice.type === constants.VOICE_TYPE_EXTERNAL_DATA);
    if (speechService.nativeSpeechSupported() && nativeVoices.length > 0) {
        var msg = new SpeechSynthesisUtterance(text);
        msg.voice = nativeVoices[0].ref;
        let isSelectedVoice = nativeVoices[0].id === preferredVoiceId;
        msg.pitch = isSelectedVoice && !options.useStandardRatePitch ? _voicePitch : 1;
        msg.rate = options.rate || (isSelectedVoice && !options.useStandardRatePitch ? _voiceRate : 1);
        msg.volume = userSettings.systemVolume / 100.0;
        log.debug("speak volume", userSettings.systemVolume);
        if (options.progressFn) {
            msg.addEventListener('boundary', options.progressFn);
            msg.addEventListener('end', options.progressFn);
        }
        window.speechSynthesis.speak(msg);
        msg.addEventListener('start', () => {
            hasSpoken = true;
            isSpeakingNative = true;
        });
        msg.addEventListener('end', () => {
            isSpeakingNative = false;
        })
    } else if (azureVoices.length > 0) {
        speechServiceAzure.speak(text, azureVoices[0].id);
        hasSpoken = true;
    } else if (externalVoices.length > 0) {
        speechServiceExternal.speak(text, externalVoices[0].ref.providerId, externalVoices[0]);
    }
    testIsSpeaking();
    setTimeout(() => {
        // Firefox takes a while until isSpeaking is true
        testIsSpeaking();
    }, 700);
    async function testIsSpeaking() {
        let speaking = await speechService.isSpeaking();
        if (speaking) {
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
            speechService.resetSpeakAfterFinished();
        })
    }
}

speechService.resetSpeakAfterFinished = function () {
    _waitingSpeakOptions.txtOrObject = '';
    _waitingSpeakOptions.options = undefined;
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
    let speaking = await speechService.isSpeaking();
    if (speaking) {
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
    isSpeakingNative = false;
    if (speechService.nativeSpeechSupported()) {
        window.speechSynthesis.cancel();
    }
    speechServiceExternal.stop();
    speechServiceAzure.stop();
};

speechService.isSpeaking = async function () {
    if (isSpeakingNative) {
        return true;
    }
    return (await speechServiceExternal.isSpeaking()) || (await speechServiceAzure.isSpeaking());
};

speechService.doAfterFinishedSpeaking = async function (fn) {
    await speechService.waitForFinishedSpeaking();
    fn = fn || (() => {});
    fn();
};

speechService.waitForFinishedSpeaking = async function () {
    let maxWait = 10000;
    let wait = 0;
    while (!(await speechService.isSpeaking()) && wait < maxWait) {
        // wait until speak starting (responsive voice)
        wait += 100;
        await util.sleep(100);
    }
    wait = 0;
    let promise = new Promise((resolve) => {
        let intervalHandler = setInterval(async () => {
            wait += 50;
            if (wait > maxWait) {
                return resolve();
            }
            let speaking = await speechService.isSpeaking();
            if (!speaking) {
                clearInterval(intervalHandler);
                resolve();
            }
        }, 50);
    });
    await promise;
};

speechService.testSpeak = function(voiceId, testSentence, testLang) {
    if (!voiceId) {
        return;
    }
    let voiceLang = speechService.getVoiceLang(voiceId);
    testLang = testLang || voiceLang;
    testSentence = testSentence || i18nService.tl('thisIsAnEnglishSentence', null, i18nService.getBaseLang(testLang));
    speechService.speak(testSentence, {
        preferredVoice: voiceId,
        useStandardRatePitch: true
    });
};

/**
 * returns array of languages codes where a TTS voice exists
 * @return {*} array of languages where one element has properties [en, de, code].
 */
speechService.getVoicesLangs = function() {
    let voiceLangCodesFull = allVoices.map((voice) => voice.langFull);
    let allVoiceLangCodes = voiceLangCodesFull.concat(allVoices.map((voice) => voice.lang));
    return i18nService.getAllLanguages().filter((lang) => allVoiceLangCodes.indexOf(lang.code) !== -1);
};

/**
 * returns array of all voices where one element has properties [name, lang, type, ref]
 * @return {[]}
 */
speechService.getVoices = function () {
    allVoices.sort(speechService.voiceSortFn);
    return allVoices;
};

speechService.getVoicesInitialized = async function () {
    await initPromise;
    return speechService.getVoices();
}

speechService.voiceSortFn = function (a, b) {
    if (!constants.IS_IOS) {
        if (a.id === constants.VOICE_DEVICE_DEFAULT) {
            return 1;
        }
        if (b.id === constants.VOICE_DEVICE_DEFAULT) {
            return -1;
        }
    }
    if (a.lang !== b.lang) {
        let lang1 = i18nService.te(`lang.${a.lang}`) ? i18nService.t(`lang.${a.lang}`) : a.langFull;
        let lang2 = i18nService.te(`lang.${b.lang}`) ? i18nService.t(`lang.${b.lang}`) : b.langFull;
        return lang1.localeCompare(lang2);
    }
    if (a.type !== b.type) {
        if (a.type === constants.VOICE_TYPE_NATIVE) return -1;
        if (b.type === constants.VOICE_TYPE_NATIVE) return 1;
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
    if (a.id === constants.VOICE_DEVICE_DEFAULT) {
        return 1;
    }
    if (b.id === constants.VOICE_DEVICE_DEFAULT) {
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

speechService.getVoiceLang = function(voiceId) {
    let voices = getVoicesById(voiceId);
    return voices && voices[0] ? voices[0].langFull : null;
}

speechService.getPreferredVoiceLang = function () {
    return speechService.getVoiceLang(_preferredVoiceId);
};

speechService.getSecondaryVoiceLang = function () {
    if (_secondVoiceId) {
        return speechService.getVoiceLang(_secondVoiceId);
    }
    return null;
};

speechService.isVoiceLangLinkedToTextLang = function () {
    return _voiceLangIsTextLang;
};

speechService.hasSpoken = function () {
    return hasSpoken;
}

speechService.getExternalVoice = function (voiceId) {
    if (!voiceId) {
        return false;
    }
    let voices = getVoicesById(voiceId) || [];
    let externalVoices = voices.filter((voice) => voice.type === constants.VOICE_TYPE_EXTERNAL_PLAYING || voice.type === constants.VOICE_TYPE_EXTERNAL_DATA);
    return externalVoices[0];
}

/**
 * reloads all voices
 * @return {Promise<void>}
 */
speechService.reinit = async function () {
    allVoices = [];
    await init();
};

function getVoicesByLang(lang) {
    let fullLangVoices = allVoices.filter((voice) => voice.langFull !== voice.lang && voice.langFull === lang);
    let langVoices = allVoices.filter((voice) => voice.lang === i18nService.getBaseLang(lang));
    return fullLangVoices.length > 0 ? fullLangVoices : langVoices;
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

function addVoice(voiceId, voiceName, voiceLang, voiceType, localVoice, originalReference) {
    voiceLang = voiceLang || 'en';
    if (voiceIgnoreList.some((ignore) => voiceId.includes(ignore))) {
        return;
    }
    if (allVoices.map((voice) => voice.id).indexOf(voiceId) !== -1) {
        return;
    }
    let existingNameIndex = allVoices.map((voice) => voice.name).indexOf(voiceName);
    if (existingNameIndex !== -1) {
        voiceName = `${voiceName} (${voiceLang})`;
        let existingVoice = allVoices[existingNameIndex];
        existingVoice.name = `${existingVoice.name} (${existingVoice.langFull})`;
    }
    allVoices.push({
        id: voiceId,
        name: voiceName,
        lang: i18nService.getBaseLang(voiceLang).toLowerCase(),
        langFull: voiceLang.toLowerCase(),
        type: voiceType,
        ref: originalReference,
        local: localVoice
    });
}

async function registerVoices(arrayNativeVoices) {
    arrayNativeVoices.forEach((voice) => {
        addVoice(voice.voiceURI, voice.name, voice.lang, constants.VOICE_TYPE_NATIVE, voice.localService, voice);
    });
}

async function init() {
    if (speechService.nativeSpeechSupported()) {
        await registerVoices(window.speechSynthesis.getVoices());
        window.speechSynthesis.onvoiceschanged = function () {
            registerVoices(window.speechSynthesis.getVoices());
        };
    }
    addVoice(constants.VOICE_DEVICE_DEFAULT, await i18nService.tLoad("defaultDeviceVoice"), i18nService.getBrowserLang(), constants.VOICE_TYPE_NATIVE, true, undefined);

    await speechServiceExternal.init();
    let externalVoices = await speechServiceExternal.getVoices();
    let azureVoices = await speechServiceAzure.getVoices();
    for (let voice of externalVoices.concat(azureVoices)) {
        addVoice(voice.id, voice.name, voice.lang, voice.type, voice.local || false, voice);
    }
    _initPromiseResolveFn();
    let voices = await speechServiceAzure.getVoices();
    log.warn(voices);
}
init();

function updateSettings() {
    let userSettings = localStorageService.getUserSettings();
    let voiceConfig = userSettings.voiceConfig || {};
    _preferredVoiceId = voiceConfig.preferredVoice || null;
    _voicePitch = voiceConfig.voicePitch || 1;
    _voiceRate = voiceConfig.voiceRate || 1;
    _secondVoiceId = voiceConfig.secondVoice || null;
    _voiceLangIsTextLang = voiceConfig.voiceLangIsTextLang || false;
}

$(document).on(constants.EVENT_USER_CHANGED, updateSettings);
$(document).on(constants.EVENT_USERSETTINGS_UPDATED, updateSettings);

export { speechService };

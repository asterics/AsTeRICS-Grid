import {constants} from "../util/constants.js";
import {audioUtil} from "../util/audioUtil.js";
import {i18nService} from "./i18nService.js";
import $ from "../externals/jquery.js";
import {localStorageService} from "./data/localStorageService.js";
import {GridActionSpeakCustom} from "../model/GridActionSpeakCustom.js";

let speechServiceExternal = {};

let externalSpeechServiceUrl = localStorageService.getAppSettings().externalSpeechServiceUrl;
let lastSpeakingResult = false;
let lastSpeakingRequestTime = 0;
let lastGetVoicesTime = 0;
let lastGetVoicesResult = null;
let playingInternal = false;
let spokeAtAnyTime = false;
let _caching = false;

let speakFetchController = new AbortController();
let speakFetchSignal = speakFetchController.signal;

speechServiceExternal.speak = async function (text, providerId, voice) {
    if (!externalSpeechServiceUrl) {
        return;
    }
    spokeAtAnyTime = true;
    text = encodeURIComponent(text);
    providerId = encodeURIComponent(providerId);
    let voiceId = encodeURIComponent(voice.id);
    if (voice.type === constants.VOICE_TYPE_EXTERNAL_PLAYING) {
        fetchErrorHandling(`${externalSpeechServiceUrl}/speak/${text}/${providerId}/${voiceId}`);
    } else if (voice.type === constants.VOICE_TYPE_EXTERNAL_DATA) {
        speakFetchController.abort();
        speakFetchController = new AbortController();
        speakFetchSignal = speakFetchController.signal;
        let response = await fetchErrorHandling(
            `${externalSpeechServiceUrl}/speakdata/${text}/${providerId}/${voiceId}`,
            {
                signal: speakFetchSignal,
                noLogErrorNames: ['AbortError']
            }
        );
        if (!response || !response.ok) {
            return;
        }
        let blob = await response.blob();
        let binary = new Uint8Array(await blob.arrayBuffer());
        if (binary.length === 0) {
            log.warn("got no data from external speech service.");
            return;
        }
        await audioUtil.playAudioUint8(binary, {
            onended: () => {
                playingInternal = false;
            }
        });
        playingInternal = true;
    }
};

speechServiceExternal.getVoices = async function (url) {
    url = url || externalSpeechServiceUrl;
    if (!url) {
        return [];
    }
    if (new Date().getTime() - lastGetVoicesTime < 1000) {
        return lastGetVoicesResult;
    }
    let result = await fetchErrorHandling(`${url}/voices`, {
        timeout: 3000
    });
    lastGetVoicesResult = result ? (await result.json()) : [];
    lastGetVoicesTime = new Date().getTime();
    return lastGetVoicesResult
};

speechServiceExternal.stop = function () {
    if (!externalSpeechServiceUrl || !spokeAtAnyTime) {
        return;
    }
    fetchErrorHandling(`${externalSpeechServiceUrl}/stop`);
    if (playingInternal) {
        audioUtil.stopAudio();
        playingInternal = false;
    }
};

speechServiceExternal.isSpeaking = async function () {
    if (!externalSpeechServiceUrl || !spokeAtAnyTime) {
        return false;
    }
    if (playingInternal) {
        return true;
    }
    if (new Date().getTime() - lastSpeakingRequestTime < 200) {
        return lastSpeakingResult;
    }
    let result = await fetchErrorHandling(`${externalSpeechServiceUrl}/speaking`);
    let speaking = result ? (await result.json()) : false;
    lastSpeakingRequestTime = new Date().getTime();
    lastSpeakingResult = speaking;
    return speaking;
}

speechServiceExternal.cacheAll = async function (grids, externalVoice, progressFn) {
    if (!externalSpeechServiceUrl || _caching) {
        log.info("not starting caching, because no external provider defined or caching already in progress.");
        return;
    }
    _caching = true;
    progressFn(0);
    let providerId = externalVoice.ref.providerId;
    let voiceId = externalVoice.id;
    progressFn = progressFn || (() => {});
    let allElements = [];
    let allStrings = [];
    for (let grid of grids) {
        allElements = allElements.concat(grid.gridElements);
    }
    let doneCount = 0;
    for (let element of allElements) {
        let label = i18nService.getTranslation(element.label);
        if (label) {
            allStrings.push(label);
        }
        let speakCustomActions = element.actions.filter(a => a.modelName === GridActionSpeakCustom.getModelName()) || [];
        for (let action of speakCustomActions) {
            let speakText = i18nService.getTranslation(action.speakText);
            allStrings.push(speakText);
        }
    }
    for (let string of allStrings) {
        let progress = Math.round((doneCount / allStrings.length) * 100);
        log.info(`[${progress}%] caching tts value: '${string}'`);
        progressFn(progress);
        string = encodeURIComponent(string);
        providerId = encodeURIComponent(providerId);
        voiceId = encodeURIComponent(voiceId);
        await fetchErrorHandling(`${externalSpeechServiceUrl}/cache/${string}/${providerId}/${voiceId}`);
        doneCount++;
    }
    _caching = false;
    progressFn(100);
    log.info('cached all tts values!');
};

/**
 * returns true if the given url is a valid speech service url
 * @param url
 * @return {Promise<boolean>}
 */
speechServiceExternal.validateUrl = async function (url) {
    if (!url) {
        return false;
    }
    let voices = await speechServiceExternal.getVoices(url);
    return voices.length > 0;
}

/**
 * fetch request with error handling.
 * @param url the url to fetch
 * @param options options passed to fetch
 * @param options.noLogErrorNames array of error names (e.name) that are allowed and aren't logged
 * @param options.timeout optional request timeout in ms
 */
async function fetchErrorHandling(url, options) {
    let result = null;
    options = options || {};
    if (options.timeout) {
        let abortController = new AbortController();
        options.signal = abortController.signal;
        setTimeout(() => abortController.abort(), options.timeout);
    }
    try {
        result = await fetch(url, options);
    } catch (e) {
        options.noLogErrorNames = options.noLogErrorNames || [];
        if (!options.noLogErrorNames.includes(e.name)) {
            log.warn('failed fetch for external speech:', e.message, url);
        }
    }
    if (result && !result.ok) {
        log.warn('error on fetch for external speech:', result.status, url);
        return null;
    }
    return result;
}

$(document).on(constants.EVENT_APPSETTINGS_UPDATED, (event, appSettings) => {
    externalSpeechServiceUrl = appSettings.externalSpeechServiceUrl;
});

export { speechServiceExternal };
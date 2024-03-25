import {constants} from "../util/constants.js";
import {audioUtil} from "../util/audioUtil.js";
import {i18nService} from "./i18nService.js";

let speechServiceExternal = {};

let externalSpeechServiceUrl = 'http://localhost:5555';
let lastSpeakingResult = false;
let lastSpeakingRequestTime = 0;
let playingInternal = false;

let speakFetchController = new AbortController();
let speakFetchSignal = speakFetchController.signal;

speechServiceExternal.speak = async function (text, providerId, voice) {
    if (!externalSpeechServiceUrl) {
        return;
    }
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
        await audioUtil.playAudioUint8(binary, {
            onended: () => {
                playingInternal = false;
            }
        });
        playingInternal = true;
    }
};

speechServiceExternal.getVoices = async function () {
    if (!externalSpeechServiceUrl) {
        return [];
    }
    let result = await fetchErrorHandling(`${externalSpeechServiceUrl}/voices`);
    return result ? (await result.json()) : [];
};

speechServiceExternal.stop = function () {
    if (!externalSpeechServiceUrl) {
        return;
    }
    fetchErrorHandling(`${externalSpeechServiceUrl}/stop`);
    if (playingInternal) {
        audioUtil.stopAudio();
        playingInternal = false;
    }
};

speechServiceExternal.isSpeaking = async function () {
    if (playingInternal) {
        return true;
    }
    if (new Date().getTime() - lastSpeakingRequestTime < 200) {
        return lastSpeakingResult;
    }
    let result = await fetchErrorHandling(`${externalSpeechServiceUrl}/speaking`);
    if (!result) {
        return false;
    }
    let speaking = await result.json();
    lastSpeakingRequestTime = new Date().getTime();
    lastSpeakingResult = speaking;
    return speaking;
}

speechServiceExternal.cacheAll = async function (grids, providerId, voiceId) {
    let allElements = [];
    for (let grid of grids) {
        allElements = allElements.concat(grid.gridElements);
    }
    let doneCount = 0;
    for (let element of allElements) {
        let label = i18nService.getTranslation(element.label);
        if (label) {
            log.info(`[${Math.round((doneCount / allElements.length) * 100)}%] caching tts value: '${label}'`);
            label = encodeURIComponent(label);
            providerId = encodeURIComponent(providerId);
            voiceId = encodeURIComponent(voiceId);
            await fetchErrorHandling(`${externalSpeechServiceUrl}/cache/${label}/${providerId}/${voiceId}`);
        }
        doneCount++;
    }
    log.info('cached all tts values!');
};

/**
 * fetch request with error handling.
 * @param url the url to fetch
 * @param options options passed to fetch
 * @param options.noLogErrorNames array of error names (e.name) that are allowed and aren't logged
 */
async function fetchErrorHandling(url, options) {
    let result = null;
    options = options || {};
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

export { speechServiceExternal };
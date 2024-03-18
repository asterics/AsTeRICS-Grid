import {constants} from "../util/constants.js";
import {audioUtil} from "../util/audioUtil.js";

let speechServiceExternal = {};

let externalSpeechServiceUrl = 'http://localhost:105';
let lastSpeakingResult = false;
let lastSpeakingRequestTime = 0;
let playingInternal = false;

speechServiceExternal.speak = async function (text, providerId, voice) {
    if (!externalSpeechServiceUrl) {
        return;
    }
    text = encodeURIComponent(text);
    providerId = encodeURIComponent(providerId);
    let voiceId = encodeURIComponent(voice.id);
    if (voice.type === constants.VOICE_TYPE_EXTERNAL_PLAYING) {
        fetch(`${externalSpeechServiceUrl}/speak/${text}/${providerId}/${voiceId}`);
    } else if (voice.type === constants.VOICE_TYPE_EXTERNAL_DATA) {
        let response = await fetch(`${externalSpeechServiceUrl}/speakdata/${text}/${providerId}/${voiceId}`);
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
    let result = await fetch(`${externalSpeechServiceUrl}/voices`);
    return await result.json();
};

speechServiceExternal.stop = function () {
    if (!externalSpeechServiceUrl) {
        return;
    }
    fetch(`${externalSpeechServiceUrl}/stop`);
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
    let result = await fetch(`${externalSpeechServiceUrl}/speaking`);
    let speaking = await result.json();
    lastSpeakingRequestTime = new Date().getTime();
    lastSpeakingResult = speaking;
    return speaking;
}

export { speechServiceExternal };
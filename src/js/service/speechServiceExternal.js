let speechServiceExternal = {};

let externalSpeechServiceUrl = 'http://localhost:105';
let lastSpeakingResult = false;
let lastSpeakingRequestTime = 0;

speechServiceExternal.speak = function (text, providerId, voiceId) {
    if (!externalSpeechServiceUrl) {
        return;
    }
    fetch(`${externalSpeechServiceUrl}/speak/${text}/${providerId}/${voiceId}`);
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
};

speechServiceExternal.isSpeaking = async function () {
    if (new Date().getTime() - lastSpeakingRequestTime < 200) {
        return lastSpeakingResult;
    }
    lastSpeakingRequestTime = new Date().getTime();
    let result = await fetch(`${externalSpeechServiceUrl}/speaking`);
    let speaking = await result.json();
    lastSpeakingResult = speaking;
    return speaking;
}

export { speechServiceExternal };
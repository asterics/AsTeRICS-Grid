import { audioUtil } from '../../util/audioUtil';
import { constants } from '../../util/constants';
import { localStorageService } from '../data/localStorageService';

let speechServiceAzure = {};

// TODO:remove
const AZURE_KEY = "AZURE_KEY";
const AZURE_REGION = "AZURE_REGION";

let msSubscriptionKey = localStorageService.get(AZURE_KEY) || "";
let msRegion = localStorageService.get(AZURE_REGION) || "";

// TODO: remove
localStorageService.save(AZURE_KEY, msSubscriptionKey);
localStorageService.save(AZURE_REGION, msRegion);

let playingInternal = false;

speechServiceAzure.speak = async function (text, voiceId) {
    if (!msSubscriptionKey || !msRegion) {
        log.warn("MS Speech credentials missing.");
        return;
    }

    const url = `https://${msRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const ssml = `
    <speak version='1.0' xml:lang='en-US'>
        <voice name='${voiceId || "en-US-JennyNeural"}'>
            ${text}
        </voice>
    </speak>`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": msSubscriptionKey,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3"
            },
            body: ssml
        });

        if (!response.ok) {
            log.error("Failed to get speech from MS service", response.status);
            return;
        }

        const blob = await response.blob();
        const binary = new Uint8Array(await blob.arrayBuffer());

        await audioUtil.playAudioUint8(binary, {
            onended: () => {
                playingInternal = false;
            }
        });

        playingInternal = true;

    } catch (e) {
        log.error("Error speaking via MS Speech", e);
    }
};

speechServiceAzure.stop = function () {
    if (playingInternal) {
        audioUtil.stopAudio();
        playingInternal = false;
    }
};

speechServiceAzure.isSpeaking = async function () {
    return playingInternal;
};

speechServiceAzure.getVoices = async function () {
    if (!msSubscriptionKey || !msRegion) return [];

    try {
        const url = `https://${msRegion}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
        const res = await fetch(url, {
            headers: {
                "Ocp-Apim-Subscription-Key": msSubscriptionKey
            }
        });
        if (!res.ok) return [];
        let objects = await res.json();
        return objects.map(azureVoice => azureVoiceToAppVoice(azureVoice));
    } catch (e) {
        log.error("Failed to get voices", e);
        return [];
    }
};

function azureVoiceToAppVoice(azureVoice) {
    return {
        id: azureVoice.ShortName,
        name: `${azureVoice.DisplayName} (${azureVoice.Gender}, ${azureVoice.Locale}, MS Azure TTS)`,
        lang: azureVoice.Locale,
        type: constants.VOICE_TYPE_MS_AZURE,
        local: false
    }
}

export { speechServiceAzure };

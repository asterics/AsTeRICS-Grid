import { audioUtil } from '../../util/audioUtil';
import { constants } from '../../util/constants';
import { localStorageService } from '../data/localStorageService';
import { util } from '../../util/util';
import { i18nService } from '../i18nService';

let speechServiceAzure = {};

// TODO:remove
const AZURE_KEY = "AZURE_KEY";
const AZURE_REGION = "AZURE_REGION";

let msSubscriptionKey = localStorageService.get(AZURE_KEY) || "";
let msRegion = localStorageService.get(AZURE_REGION) || "";

// TODO: remove
localStorageService.save(AZURE_KEY, msSubscriptionKey);
localStorageService.save(AZURE_REGION, msRegion);
window.localStorageService = localStorageService;

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
    msSubscriptionKey = msSubscriptionKey || window.azureKey; // TODO: remove
    msRegion = msRegion || window.azureRegion; // TODO: remove
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
        // analyzeObjects(objects);
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

function analyzeObjects(objects) {
    let langs = objects.map(o => o.Locale);
    let langShort = langs.map(lang => i18nService.getBaseLang(lang));
    let tags = objects.reduce((total, elem) => {
        if(elem.VoiceTag && elem.VoiceTag.VoicePersonalities) {
            total = total.concat(elem.VoiceTag.VoicePersonalities);
        }
        return total;
    }, []);
    let scenarios = objects.reduce((total, elem) => {
        if(elem.VoiceTag && elem.VoiceTag.TailoredScenarios) {
            total = total.concat(elem.VoiceTag.TailoredScenarios);
        }
        return total;
    }, []);
    tags = util.deduplicateArray(tags);
    langs = util.deduplicateArray(langs);
    langShort = util.deduplicateArray(langShort);
    let langsFull = langShort.map(lang => i18nService.t('lang.' + lang));
    langsFull.sort();
    scenarios = util.deduplicateArray(scenarios);

    log.warn(langsFull);
    log.warn(tags);
    log.warn(scenarios);
    log.warn(objects.filter(elem => elem.VoiceTag && elem.VoiceTag.VoicePersonalities && elem.VoiceTag.VoicePersonalities.includes("Bright") ))
    log.warn(objects.filter(elem => elem.Name.includes("Gisela") ))
}

export { speechServiceAzure };

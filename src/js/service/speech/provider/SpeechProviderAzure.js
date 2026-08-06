import { audioUtil } from '../../../util/audioUtil';
import { constants } from '../../../util/constants';
import { localStorageService } from '../../data/localStorageService';
import { BaseSpeechProvider } from './BaseSpeechProvider';
import { Voice } from '../Voice.js';

const AZURE_KEY = "AZURE_KEY";
const AZURE_REGION = "AZURE_REGION";

class SpeechProviderAzure extends BaseSpeechProvider {
    constructor() {
        super();
        this._playing = false;
        this._subscriptionKey = null;
        this._region = null;
    }

    init() {
        this._subscriptionKey = window.azureKey || localStorageService.get(AZURE_KEY);
        this._region = window.azureRegion || localStorageService.get(AZURE_REGION);
    }

    async speak(text, voice) {
        if (!this._subscriptionKey || !this._region) {
            log.warn("MS Speech credentials missing.");
            return;
        }

        const voiceId = voice?.id || "en-US-JennyNeural";
        const url = `https://${this._region}.tts.speech.microsoft.com/cognitiveservices/v1`;
        const escapedText = escapeXml(text);

        const ssml = `
    <speak version='1.0' xml:lang='en-US'>
        <voice name='${escapeXml(voiceId)}'>
            ${escapedText}
        </voice>
    </speak>`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Ocp-Apim-Subscription-Key": this._subscriptionKey,
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

            this._playing = true;
            await audioUtil.playAudioUint8(binary, {
                onended: () => {
                    this._playing = false;
                }
            });
        } catch (e) {
            log.error("Error speaking via MS Speech", e);
        }
    }

    async stop() {
        if (this._playing) {
            audioUtil.stopAudio();
            this._playing = false;
        }
    }

    async isSpeaking() {
        return this._playing;
    }

    async getVoicesInternal() {
        if (!this._subscriptionKey || !this._region) return [];

        try {
            const url = `https://${this._region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
            const res = await fetch(url, {
                headers: {
                    "Ocp-Apim-Subscription-Key": this._subscriptionKey
                }
            });
            if (!res.ok) return [];
            let objects = await res.json();
            return objects.map(azureVoice => new Voice({
                id: azureVoice.ShortName,
                name: `${azureVoice.DisplayName} (${azureVoice.Gender}, ${azureVoice.Locale}, MS Azure TTS)`,
                lang: azureVoice.Locale,
                type: constants.VOICE_TYPE_MS_AZURE,
                local: false
            }));
        } catch (e) {
            log.error("Failed to get voices", e);
            return [];
        }
    }

    async validateSetup() {
        return !!(this._subscriptionKey && this._region);
    }
}

function escapeXml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
}

export { SpeechProviderAzure };
import { constants } from '../../../util/constants';
import { i18nService } from '../../i18nService';
import voiceUtil from '../../../util/voiceUtil';
import { BaseSpeechProvider } from './BaseSpeechProvider';
import { Voice } from '../Voice.js';

let voiceIgnoreList = ['com.apple.speech.synthesis.voice'];

/**
 * TTS provider for the WebSpeechAPI, see https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
 */
class SpeechProviderWebSpeech extends BaseSpeechProvider {
    constructor() {
        super();
        this._speaking = false;
    }

    init() {
        window.speechSynthesis.addEventListener("voiceschanged", async () => {
            this.notifyVoiceUpdate();
        });
    }

    async speak(text, voice, options = {}) {
        if (!this._isSupported()) {
            return;
        }
        let msg = new SpeechSynthesisUtterance(text);
        msg.voice = voice?.ref || null;
        msg.pitch = options.pitch ?? 1;
        msg.rate = options.rate ?? 1;
        msg.volume = options.volume ?? 1;
        if (options.progressFn) {
            msg.addEventListener('boundary', options.progressFn);
            msg.addEventListener('end', options.progressFn);
        }
        window.speechSynthesis.speak(msg);
        msg.addEventListener('start', () => {
            this._speaking = true;
        });
        msg.addEventListener('end', () => {
            this._speaking = false;
        });
    }

    async stop() {
        this._speaking = false;
        if (this._isSupported()) {
            window.speechSynthesis.cancel();
        }
    }

    async isSpeaking() {
        return this._speaking;
    }

    async getVoicesInternal() {
        if (!this._isSupported()) {
            return [];
        }
        let nativeVoices = window.speechSynthesis.getVoices();
        let voices = [];
        let nameCount = {};
        for (let nv of nativeVoices) {
            if (voiceIgnoreList.some((ignore) => nv.voiceURI.includes(ignore))) {
                continue;
            }
            nameCount[nv.name] = (nameCount[nv.name] || 0) + 1;
        }
        for (let nv of nativeVoices) {
            if (voiceIgnoreList.some((ignore) => nv.voiceURI.includes(ignore))) {
                continue;
            }
            let name = nv.name;
            if (nameCount[name] > 1) {
                name = `${name} (${nv.lang})`;
            }
            voices.push(new Voice({
                id: nv.voiceURI,
                name: name,
                lang: nv.lang,
                type: constants.VOICE_TYPE_NATIVE,
                local: voiceUtil.isVoiceOffline(nv.voiceURI, nv.name, nv.localService),
                ref: nv
            }));
        }
        voices.push(new Voice({
            id: constants.VOICE_DEVICE_DEFAULT,
            name: await i18nService.tLoad("defaultDeviceVoice"),
            lang: i18nService.getBrowserLang(),
            type: constants.VOICE_TYPE_NATIVE,
            local: true
        }));
        return voices;
    }

    async validateSetup() {
        return this._isSupported();
    }

    _isSupported() {
        return !!(
            typeof SpeechSynthesisUtterance !== 'undefined' &&
            window.speechSynthesis &&
            window.speechSynthesis.getVoices
        );
    }
}

export { SpeechProviderWebSpeech };

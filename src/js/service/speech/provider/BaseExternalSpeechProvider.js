import { audioUtil } from '../../../util/audioUtil';
import { constants } from '../../../util/constants';
import { i18nService } from '../../i18nService';
import { GridActionSpeakCustom } from '../../../model/GridActionSpeakCustom';
import { util } from '../../../util/util';
import { BaseSpeechProvider } from './BaseSpeechProvider';
import { Voice } from '../Voice.js';

const JWT_REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * TTS provider base for external TTS services using the API format developed for Asterics AAC,
 * see https://github.com/asterics/Asterics-AAC-Helper/tree/main/speech#rest-api
 * see https://github.com/asterics/Asterics-AAC-TTS-Proxy
 */
class BaseExternalSpeechProvider extends BaseSpeechProvider {

    voiceChangeHandler = null;

    constructor() {
        super();
        this._playingInternal = false;
        this._spokeExternalAtAnyTime = false;
        this._caching = false;
        this._jwt = {};
        this._lastSpeakingResult = false;
        this._lastSpeakingRequestTime = 0;
        this._lastGetVoicesTime = 0;
        this._lastGetVoicesResult = null;
        this._speakFetchController = new AbortController();
    }

    _getUrl() {
        throw new Error(`Method '_getUrl()' must be implemented by the subclass ${this.constructor.name}.`);
    }

    async init() {
        let url = this._getUrl();
        if (!url) return;
        try {
            let needsAuth = await util.fetchJson(`${url}/auth/requires-auth`);
            if (needsAuth) {
                await this._authenticate();
            }
        } catch (e) {
            log.warn('external speech init failed:', e.message);
        }
    }

    async _authenticate() {
        let url = this._getUrl();
        if (!url) return;
        if (this._jwt && this._jwt.expires && this._jwt.expires - Date.now() > 2 * JWT_REFRESH_INTERVAL_MS) {
            log.debug('not updating JWT, not expiring soon.');
        } else {
            log.debug('updating external speech JWT token...');
            this._jwt = await util.postJson(`${url}/auth/token`, { apiKey: 'sk_per_d5f98b03f5dec3604e7414c2c9c2c5dd22faedd2b566fb04' });
        }
        if (this._jwt && this._jwt.expires) {
            setTimeout(() => this._authenticate(), JWT_REFRESH_INTERVAL_MS);
        }
    }

    async speak(text, voice) {
        let url = this._getUrl();
        if (!url) return;
        text = encodeURIComponent(text);
        let providerId = encodeURIComponent(voice?.ref?.providerId);
        let voiceId = encodeURIComponent(voice.id);
        if (voice.type === constants.VOICE_TYPE_EXTERNAL_PLAYING) {
            this._spokeExternalAtAnyTime = true;
            this._fetchErrorHandling(`${url}/tts/speak/${text}/${providerId}/${voiceId}`);
        } else if (voice.type === constants.VOICE_TYPE_EXTERNAL_DATA) {
            this._speakFetchController.abort();
            this._speakFetchController = new AbortController();
            let response = await this._fetchErrorHandling(
                `${url}/tts/speakdata/${text}/${providerId}/${voiceId}`,
                {
                    signal: this._speakFetchController.signal,
                    noLogErrorNames: ['AbortError']
                }
            );
            if (!response || !response.ok) return;
            let blob = await response.blob();
            let buffer = await blob.arrayBuffer();
            if (buffer.byteLength === 0) {
                log.warn("got no data from external speech service.");
                return;
            }
            await audioUtil.playAudioUint8(buffer, {
                onended: () => {
                    this._playingInternal = false;
                }
            });
            this._playingInternal = true;
        }
    }

    async stop() {
        let url = this._getUrl();
        if (!url) return;
        if (this._playingInternal) {
            audioUtil.stopAudio();
            this._playingInternal = false;
        }
        if (!this._spokeExternalAtAnyTime) return;
        this._fetchErrorHandling(`${url}/tts/stop`);
    }

    async isSpeaking() {
        let url = this._getUrl();
        if (!url) return false;
        if (this._playingInternal) return true;
        if (!this._spokeExternalAtAnyTime) return false;
        if (new Date().getTime() - this._lastSpeakingRequestTime < 200) {
            return this._lastSpeakingResult;
        }
        let result = await this._fetchErrorHandling(`${url}/tts/speaking`);
        let speaking = result ? (await result.json()) : false;
        this._lastSpeakingRequestTime = new Date().getTime();
        this._lastSpeakingResult = speaking;
        return speaking;
    }

    async getVoicesInternal() {
        let rawVoices = await this._fetchVoicesFromUrl(this._getUrl());
        return rawVoices.map(v => new Voice({
            id: v.id,
            name: v.name,
            lang: v.lang,
            type: v.type,
            local: v.local || false,
            ref: v
        }));
    }

    async _fetchVoicesFromUrl(url) {
        if (!url) return [];
        if (new Date().getTime() - this._lastGetVoicesTime < 1000) {
            return this._lastGetVoicesResult;
        }
        let result = await this._fetchErrorHandling(`${url}/tts/voices`, {
            timeout: 3000
        });
        this._lastGetVoicesResult = result ? (await result.json()) : [];
        this._lastGetVoicesTime = new Date().getTime();
        return this._lastGetVoicesResult;
    }

    async validateSetup() {
        let url = this._getUrl();
        if (!url) return false;
        let voices = await this._fetchVoicesFromUrl(url);
        return voices.length > 0;
    }

    async validateUrl(url) {
        if (!url) return false;
        let voices = await this._fetchVoicesFromUrl(url);
        return voices.length > 0;
    }

    async cacheAll(grids, externalVoice, progressFn) {
        let url = this._getUrl();
        if (!url || this._caching) {
            log.info("not starting caching, because no external provider defined or caching already in progress.");
            return;
        }
        this._caching = true;
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
            await this._fetchErrorHandling(`${url}/tts/cache/${string}/${providerId}/${voiceId}`);
            doneCount++;
        }
        this._caching = false;
        progressFn(100);
        log.info('cached all tts values!');
    }

    async _fetchErrorHandling(url, options) {
        let result = null;
        options = options || {};
        if (this._jwt && this._jwt.token) {
            options.headers = options.headers || {};
            options.headers['Authorization'] = `Bearer ${this._jwt.token}`;
        }
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
}

export { BaseExternalSpeechProvider };

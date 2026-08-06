import { BaseExternalSpeechProvider } from './BaseExternalSpeechProvider';

let BASE_URL_TTS_PROXY = "";

/**
 * TTS provider for Asterics AAC TTS-Proxy, see https://github.com/asterics/Asterics-AAC-TTS-Proxy
 */
class SpeechProviderTTSProxy extends BaseExternalSpeechProvider {

    _getUrl() {
        return BASE_URL_TTS_PROXY;
    }
}

export { SpeechProviderTTSProxy };

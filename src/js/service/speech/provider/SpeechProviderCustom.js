import { localStorageService } from '../../data/localStorageService';
import {BaseExternalSpeechProvider} from './BaseExternalSpeechProvider';

/**
 * TTS provider for any custom TTS endpoint implementing the Asterics AAC REST API for TTS, e.g. https://github.com/asterics/Asterics-AAC-Helper/tree/main/speech#rest-api
 */
class SpeechProviderCustom extends BaseExternalSpeechProvider {

    init() {
        this._url = localStorageService.getAppSettings().externalSpeechServiceUrl;
        return super.init();
    }

    setUrl(url) {
        this._url = url;
    }

    _getUrl() {
        return this._url || null;
    }
}

export {SpeechProviderCustom};

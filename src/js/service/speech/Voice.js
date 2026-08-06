import { i18nService } from '../i18nService';

class Voice {
    /**
     * @param {object} properties
     * @param {string} properties.id - unique voice identifier (e.g. voiceURI for native, ShortName for Azure)
     * @param {string} properties.name - display name
     * @param {string} properties.lang - language code (e.g. "en-US", "de", "de-AT")
     * @param {string} properties.type - voice type constant (e.g. VOICE_TYPE_NATIVE, VOICE_TYPE_MS_AZURE)
     * @param {boolean} [properties.local=false] - whether the voice works offline
     * @param {*} [properties.ref] - original reference object (e.g. native SpeechSynthesisVoice, or provider-specific data)
     */
    constructor(properties = {}) {
        if (!properties.id || !properties.name || !properties.lang || !properties.type) {
            throw new Error(`Voice requires id, name, lang, and type. Got: ${JSON.stringify(properties)}`);
        }
        this.id = properties.id;
        this.name = properties.name;
        this.langFull = properties.lang.toLowerCase();
        this.lang = i18nService.getBaseLang(this.langFull).toLowerCase();
        this.type = properties.type;
        this.local = properties.local || false;
        this.ref = properties.ref !== undefined ? properties.ref : null;
        this._provider = null; // set by BaseSpeechProvider.getVoices()
    }
}

export { Voice };

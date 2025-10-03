import { constants } from "../util/constants.js";

class VoiceConfig {
    /**
     * @param settings.preferredProvider
     * @param settings.preferredVoice
     * @param settings.secondVoice
     * @param settings.voiceLangIsTextLang
     * @param settings.voicePitch
     * @param settings.voiceRate
     * @param settings.providerVoices
     * @param settings.providerSettings
     */
    constructor(settings) {
        settings = settings || {};
        this.preferredProvider = settings.preferredProvider || constants.DEFAULT_VOICE_PROVIDER;
        this.preferredVoice = settings.preferredVoice;
        this.secondVoice = settings.secondVoice;
        this.voiceLangIsTextLang = settings.voiceLangIsTextLang;
        this.voicePitch = settings.voicePitch;
        this.voiceRate = settings.voiceRate;
        this.providerVoices = settings.providerVoices ? JSON.parse(JSON.stringify(settings.providerVoices)) : {};
        this.providerSettings = settings.providerSettings ? JSON.parse(JSON.stringify(settings.providerSettings)) : {};
    }
}

export { VoiceConfig };

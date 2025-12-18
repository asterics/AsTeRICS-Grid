class VoiceConfig {
    /**
     * @param settings.preferredVoice
     * @param settings.secondVoice
     * @param settings.voiceLangIsTextLang
     * @param settings.voicePitch
     * @param settings.voiceRate
     */
    constructor(settings) {
        settings = settings || {};
        this.preferredVoice = settings.preferredVoice;
        this.secondVoice = settings.secondVoice;
        this.voiceLangIsTextLang = settings.voiceLangIsTextLang;
        this.voicePitch = settings.voicePitch;
        this.voiceRate = settings.voiceRate;
    }
}

export { VoiceConfig };
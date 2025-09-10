import { convertServiceLocal } from '../service/data/convertServiceLocal.js';

class SettingsApp {
    /**
     * @param settings.modelVersion
     * @param settings.appLang
     * @param settings.unlockPasscode
     * @param settings.syncNavigation
     * @param settings.externalSpeechServiceUrl
     */
    constructor(settings) {
        settings = settings || {};
        this.modelVersion = settings.modelVersion;
        // Handle appLang with three states:
        // - null/undefined: never set, use browser language
        // - "": explicitly set to automatic, use browser language
        // - "xx": specific language code
        this.appLang = settings.appLang !== undefined ? settings.appLang : null;
        this.unlockPasscode = settings.unlockPasscode;
        this.syncNavigation = settings.syncNavigation;
        this.externalSpeechServiceUrl = settings.externalSpeechServiceUrl;

        convertServiceLocal.updateDataModel(this);
    }
}

export { SettingsApp };
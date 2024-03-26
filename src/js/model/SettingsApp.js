import {convertServiceLocal} from "../service/data/convertServiceLocal.js";

class SettingsApp {
    /**
     * @param settings.appLang
     * @param settings.unlockPasscode
     * @param settings.externalSpeechServiceUrl
     */
    constructor(settings) {
        settings = settings || {};
        this.modelVersion = settings.modelVersion;
        this.appLang = settings.appLang;
        this.unlockPasscode = settings.unlockPasscode;
        this.syncNavigation = settings.syncNavigation;
        this.externalSpeechServiceUrl = settings.externalSpeechServiceUrl;

        convertServiceLocal.updateDataModel(this);
    }
}

export {SettingsApp};
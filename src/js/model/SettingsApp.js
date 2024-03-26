import {localStorageService} from "../service/data/localStorageService.js";

let DEPRECATED_UNLOCK_PASSCODE_KEY = 'AG_UNLOCK_PASSCODE_KEY';
let DEPRECATED_SYNC_NAVIGATION_KEY = 'AG_SYNC_NAVIGATION_KEY';

class SettingsApp {
    /**
     * @param settings.appLang
     * @param settings.unlockPasscode
     * @param settings.externalSpeechServiceUrl
     */
    constructor(settings) {
        settings = settings || {};
        this.unlockPasscode = settings.unlockPasscode !== undefined ? settings.unlockPasscode : localStorageService.getJSON(DEPRECATED_UNLOCK_PASSCODE_KEY);
        this.syncNavigation = settings.syncNavigation !== undefined ? settings.syncNavigation : localStorageService.getJSON(DEPRECATED_SYNC_NAVIGATION_KEY);
    }
}

export {SettingsApp};
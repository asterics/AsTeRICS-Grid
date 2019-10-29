import {$} from '../externals/jquery';
import {localStorageService} from "./data/localStorageService";

let i18nService = {};

let CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let customLanguage = localStorageService.get(CUSTOM_LANGUAGE_KEY);
let TRANSLATION_FILE_PATH = 'app/examples/translations/';
let TRANSLATION_FILE_SUFFIX = '.txt';
let TRANSLATION_FILE_ORIGINAL = getTranslationFilePath('original');
let i18nInstance = null;
let languages = ['en', 'de'];
let separator = ' // ';

i18nService.initDomI18n = function () {
    if (!i18nInstance) {
        i18nInstance = window.domI18n({
            selector: '[data-i18n]',
            separator: separator,
            languages: languages,
            enableLog: false
        });
    }
    i18nInstance.changeLanguage(i18nService.getBrowserLang());

};

i18nService.getBrowserLang = function () {
    return customLanguage || navigator.language.substring(0, 2).toLowerCase();
};

i18nService.isBrowserLangDE = function () {
    return i18nService.getBrowserLang() === 'de';
};

i18nService.translate = function (key) {
    if (key && key.indexOf(separator) > -1) {
        let translations = key.split(separator);
        let index = languages.indexOf(i18nService.getBrowserLang());
        index = index > 0 ? index : 0;
        return translations[index];
    }
    var lang = this.translations[this.getBrowserLang()] ? this.getBrowserLang() : 'en';
    var translated = this.translations[lang][key] ? this.translations[lang][key] : key;
    for(var i=1; i<arguments.length; i++) {
        translated = translated.replace('{?}', arguments[i]);
    }
    return translated;
};

/**
 * Translates given grids using translation .txt files located in app/examples/translations.
 * The language to translate to is defined by the current browser language.
 *
 * @param grids the grids to translate
 * @return {Promise<unknown>} a promise resolving the translated grids or the original grids, if nothing was translated
 */
i18nService.translateGrids = function (grids) {
    return new Promise(resolve => {
        if (!grids || !grids.length || grids.length <= 0 || getCurrentLang(grids) === i18nService.getBrowserLang()) {
            return resolve(grids);
        }
        let originals = null;
        let translated = null;
        let lang = i18nService.getBrowserLang();
        let promiseOriginals = $.get(TRANSLATION_FILE_ORIGINAL);
        let promiseTranslated = $.get(getTranslationFilePath(lang));
        promiseOriginals.then(data => {
            originals = data || '';
        });
        promiseTranslated.then(data => {
            translated = data || '';
        });
        Promise.all([promiseOriginals, promiseTranslated]).then(() => {
            let phrasesOriginal = originals.split('\n').map(p => p.trim()).filter(p => !!p);
            let phrasesTranslated = translated.split('\n').map(p => p.trim()).filter(p => !!p);
            if (phrasesOriginal.length !== phrasesTranslated.length) {
                return resolve(grids);
            }
            grids.forEach(grid => {
                if (grid.gridElements) {
                    grid.gridElements.forEach(element => {
                        let index = phrasesOriginal.indexOf(element.label);
                        element.label = index > -1 ? phrasesTranslated[index] : element.label;
                        if (element.actions) {
                            element.actions.forEach(action => {
                                if (action.speakLanguage) {
                                    action.speakLanguage = lang;
                                }
                                if (action.speakText) {
                                    let index = phrasesOriginal.indexOf(action.speakText);
                                    action.speakText = index > -1 ? phrasesTranslated[index] : action.speakText;
                                }
                            })
                        }
                    });
                }
            });
            log.info('translated gridset to: ' + lang);
            resolve(grids);
        }).catch(() => {
            resolve(grids);
        });
    });
};

/**
 * sets the language code to use (ISO 639-1)
 * @param lang two-letter language code to use
 */
i18nService.setLanguage = function (lang) {
    customLanguage = lang;
    if (i18nInstance) {
        i18nInstance.changeLanguage(lang);
    }
    localStorageService.save(CUSTOM_LANGUAGE_KEY, customLanguage);
};

/**
 * retrieves the language code previously set with setLanguage().
 */
i18nService.getCustomLanguage = function () {
    return customLanguage;
};

function getTranslationFilePath(filename) {
    return TRANSLATION_FILE_PATH + filename + TRANSLATION_FILE_SUFFIX;
}

/**
 * returns the (assumed) used language of a gridset by retrieving the first "speakLanguage" property
 * @param grids
 * @return the current language of the gridset (assumed) or null if not determined
 */
function getCurrentLang(grids) {
    let jsonString = JSON.stringify(grids);
    let matches = jsonString.match(/\"speakLanguage\":\"(.{2})\"/);
    return matches ? matches[1] : null;
}

i18nService.translations = {};
i18nService.translations['en'] = {
    GridActionSpeak: 'Speak label',
    GridActionSpeakCustom: 'Speak custom text',
    GridActionNavigate: 'Navigate to other grid',
    GridActionARE: 'AsTeRICS action',
    GridActionPredict: 'Fill prediction elements',
    GridActionCollectElement: 'Collect element action',
    COLLECT_ACTION_CLEAR: 'Clear collect element',
    COLLECT_ACTION_REMOVE_WORD: 'Delete last word',
    COLLECT_ACTION_REMOVE_CHAR: 'Delete last character',
    COLLECT_ACTION_COPY_CLIPBOARD: 'Copy text to clipboard',
    COLLECT_ACTION_APPEND_CLIPBOARD: 'Append text to clipboard',
    COLLECT_ACTION_CLEAR_CLIPBOARD: 'Clear clipboard',
    CONFIRM_IMPORT_BACKUP: 'Caution: This will delete all existing grids and replace them with the grids from the backup "{?}". Continue?',
    CONFIRM_DELETE_GRID: 'Do you really want to delete the grid "{?}"?',
    CONFIRM_DELETE_DICT: 'Do you really want to delete the dictionary "{?}"?',
    CONFIRM_RESET_DB: 'Do you really want to reset to default configuration? All current grids will be deleted!',
    CONFIRM_DELETE_ALL_ELEMS: 'Do you really want to delete all elements of the current grid?',
    CONFIRM_REMOVE_USER: 'Do you really want to unlink user "{?}"? This will not delete the user itself, but all data of the user stored on this device.',
    CONFIRM_REMOVE_USER_LOCAL: 'Do you really want to delete user "{?}"? Since the user is not synchronized this action will permanently delete the user.',
    PLACEHOLDER_SEARCH_GRID: 'Search grid',
    LABEL_USER_LOCAL: 'offline-only user',
    LABEL_USER_CLOUD: 'user synced with the cloud',
    LABEL_USER_ONLINE: 'only online, no offline synchronization',
    ERROR_CODE_UNAUTHORIZED: 'Login failed, wrong username or password.',
    ERROR_CODE_NETWORK_ERROR: 'Login failed (network error), please try again later.',
    DB_SYNC_STATE_SYNCINC: 'synchronizing with cloud...',
    DB_SYNC_STATE_SYNCED: 'synchronized with cloud',
    DB_SYNC_STATE_STOPPED: 'synchronization with cloud paused',
    DB_SYNC_STATE_FAIL: 'not synchronizing with cloud',
    DB_SYNC_STATE_ONLINEONLY: 'online-only, no offline synchronization',
    VALIDATION_ERROR_REGEX: 'Username must start lowercase, valid characters are [a-z], [0-9] and ["-", "_"], valid length is 3-50 characters.',
    VALIDATION_ERROR_EXISTING: 'Username is already existing.',
    SEARCH_IMAGE_PLACEHOLDER: 'input search term',
    HEADER_COMPARE_ONLINE_OFFLINE: 'Information about online/offline users',
    ADVANCED_SETTINGS: "Advanced Settings",
    TEST_CONFIGURATION: "Test configuration",
    SELECT: 'Select element',
    NEXT: 'Next scanning group',
    NEXT_ELEMENT: 'Next element',
    UP: 'Go up',
    DOWN: 'Go down',
    LEFT: 'Go left',
    RIGHT: 'Go right',
    GENERAL_INPUT: 'Input',
    InputEventKey: 'Keypress',
    InputEventARE: 'AsTeRICS ARE event',
    de: 'German',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    hi: 'Hindi',
    id: 'Indonesian',
    it: 'Italian',
    ja: 'Japanese',
    ko: 'Korean',
    nl: 'Dutch',
    pl: 'Polish',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese'
};

i18nService.translations['de'] = {
    GridActionSpeak: 'Label aussprechen',
    GridActionSpeakCustom: 'Benutzerdefinierten Text aussprechen',
    GridActionNavigate: 'Zu anderem Grid navigieren',
    GridActionARE: 'AsTeRICS Aktion',
    GridActionPredict: 'Vorhersage-Elemente füllen',
    GridActionCollectElement: 'Sammelelement Aktion',
    COLLECT_ACTION_CLEAR: 'Sammelelement leeren',
    COLLECT_ACTION_REMOVE_WORD: 'Letztes Word löschen',
    COLLECT_ACTION_REMOVE_CHAR: 'Letzten Buchstaben löschen',
    COLLECT_ACTION_COPY_CLIPBOARD: 'Text in die Zwischenablage kopieren',
    COLLECT_ACTION_APPEND_CLIPBOARD: 'Text zu Zwischenablage hinzufügen',
    COLLECT_ACTION_CLEAR_CLIPBOARD: 'Zwischenablage leeren',
    CONFIRM_IMPORT_BACKUP: 'Achtung: Diese Aktion wird alle existierenden Grids löschen und sie mit den Grids des Backups "{?}" ersetzen. Fortfahren?',
    CONFIRM_DELETE_GRID: 'Möchten Sie das Grid "{?}" wirklich löschen?',
    CONFIRM_DELETE_DICT: 'Möchten Sie das Wörterbuch "{?}" wirklich löschen?',
    CONFIRM_RESET_DB: 'Möchten Sie wirklich die Standardkonfiguration wiederherstellen? Alle aktuellen Grids werden dadurch gelöscht!',
    CONFIRM_DELETE_ALL_ELEMS: 'Möchten Sie wirklich alle Elemente des aktuellen Grids löschen?',
    CONFIRM_REMOVE_USER: 'Möchten Sie den Account "{?}" wirklich von diesem Gerät abmelden? Diese Aktion löscht nicht den User selbst, aber alle Daten des Users auf diesem Gerät.',
    PLACEHOLDER_SEARCH_GRID: 'Grid suchen',
    LABEL_USER_LOCAL: 'nur offline gespeicherter User',
    CONFIRM_REMOVE_USER_LOCAL: 'Möchten Sie den User "{?}" wirklich permanent löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    LABEL_USER_CLOUD: 'mit Cloud synchronisierter User',
    LABEL_USER_ONLINE: 'nur online, keine offline Synchronisation',
    ERROR_CODE_UNAUTHORIZED: 'Login fehlgeschlagen, falscher Benutzername oder Passwort.',
    ERROR_CODE_NETWORK_ERROR: 'Login fehlgeschlagen (Netzwerkproblem), bitte versuchen Sie es später nochmal.',
    DB_SYNC_STATE_SYNCINC: 'synchronisiere mit Cloud...',
    DB_SYNC_STATE_SYNCED: 'Mit Cloud synchronisiert',
    DB_SYNC_STATE_STOPPED: 'Synchronisation mit Cloud pausiert',
    DB_SYNC_STATE_FAIL: 'Keine Synchronisierung mit Cloud',
    DB_SYNC_STATE_ONLINEONLY: 'nur online, keine Offline-Synchronisierung',
    VALIDATION_ERROR_REGEX: 'Username muss mit einem Kleinbuchstaben beginnen, erlaubte Zeichen sind [a-z], [0-9] und ["-", "_"], erlaubte Länge ist 3-50 Zeichen.',
    VALIDATION_ERROR_EXISTING: 'Username existiert bereits.',
    SEARCH_IMAGE_PLACEHOLDER: 'Suchbegriff eingeben',
    HEADER_COMPARE_ONLINE_OFFLINE: 'Informationen über Online-/Offline-User',
    ADVANCED_SETTINGS: "Erweiterte Einstellungen",
    TEST_CONFIGURATION: "Konfiguration testen",
    SELECT: 'Element auswählen',
    NEXT: 'Nächste Gruppe',
    NEXT_ELEMENT: 'Nächstes Element',
    UP: 'Nach oben',
    DOWN: 'Nach unten',
    LEFT: 'Nach links',
    RIGHT: 'Nach rechts',
    GENERAL_INPUT: 'Eingabe',
    InputEventKey: 'Tastendruck',
    InputEventARE: 'AsTeRICS ARE Event',
    de: 'Deutsch',
    en: 'Englisch',
    es: 'Spanisch',
    fr: 'Französisch',
    hi: 'Hindi',
    id: 'Indonesisch',
    it: 'Italienisch',
    ja: 'Japanisch',
    ko: 'Koreanisch',
    nl: 'Holländisch',
    pl: 'Polnisch',
    pt: 'Portugiesisch',
    ru: 'Russisch',
    zh: 'Chinesisch'
};

export {i18nService};
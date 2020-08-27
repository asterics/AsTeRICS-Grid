import {localStorageService} from "./data/localStorageService";

let i18nService = {};

let CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let customLanguage = localStorageService.get(CUSTOM_LANGUAGE_KEY);
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

i18nService.translate = function (key, ...args) {
    if (key && key.indexOf(separator) > -1) {
        let translations = key.split(separator);
        let locale = args[0] === 'en' ||  args[0] === 'de' ? args[0] : i18nService.getBrowserLang();
        let index = languages.indexOf(locale);
        index = index > 0 ? index : 0;
        args.forEach(arg => {
            translations[index] = translations[index].replace('{?}', arg);
        });
        return translations[index];
    }
    let lang = this.translations[this.getBrowserLang()] ? this.getBrowserLang() : 'en';
    let translated = this.translations[lang][key] ? this.translations[lang][key] : key;
    args.forEach(arg => {
        translated = translated.replace('{?}', arg);
    });
    return translated;
};

/**
 * get plain translation string from an translation object
 * @param i18nObject translation object, e.g. {en: 'english text', de: 'deutscher Text'}
 * @param fallbackLang language to use if current browser language not available, default: 'en'
 * @param includeLang if true return format is {lang: <languageCode>, text: <translatedText>}
 * @return {string|*|string} the translated string in current browser language, e.g. 'english text'
 */
i18nService.getTranslation = function (i18nObject, fallbackLang, includeLang) {
    if (!i18nObject) {
        return '';
    }
    fallbackLang = fallbackLang || 'en';
    if (typeof i18nObject === 'string') {
        return i18nObject;
    }
    let currentLang = i18nService.getBrowserLang();
    if (i18nObject[currentLang]) {
        return !includeLang ? i18nObject[currentLang] : {lang: currentLang, text: i18nObject[currentLang]};
    }
    if (i18nObject[fallbackLang]) {
        return !includeLang ? i18nObject[fallbackLang] : {lang: fallbackLang, text: i18nObject[fallbackLang]};
    }
    let keys = Object.keys(i18nObject);
    if (i18nObject[keys[0]]) {
        return !includeLang ? i18nObject[keys[0]] : {lang: keys[0], text: i18nObject[keys[0]]};
    }
    return !includeLang ? '' : {lang: undefined, text: ''};
};

/**
 * turns a given label to a translation object
 * @param label plain string label
 * @param locale locale of the string (2 chars, ISO 639-1)
 * @return translation object, e.g. {en: 'given label'}
 */
i18nService.getTranslationObject = function(label, locale) {
    locale = locale || i18nService.getBrowserLang();
    label = i18nService.translate(label, locale);
    let object = {};
    object[locale] = label;
    return object;
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

i18nService.translations = {};
i18nService.translations['en'] = {
    GridActionSpeak: 'Speak label',
    GridActionSpeakCustom: 'Speak custom text',
    GridActionNavigate: 'Navigate to other grid',
    GridActionARE: 'AsTeRICS action',
    GridActionPredict: 'Fill prediction elements',
    GridActionCollectElement: 'Collect element action',
    GridActionWebradio: 'Web radio action',
    COLLECT_ACTION_CLEAR: 'Clear collect element',
    COLLECT_ACTION_REMOVE_WORD: 'Delete last word',
    COLLECT_ACTION_REMOVE_CHAR: 'Delete last character',
    COLLECT_ACTION_COPY_CLIPBOARD: 'Copy text to clipboard',
    COLLECT_ACTION_APPEND_CLIPBOARD: 'Append text to clipboard',
    COLLECT_ACTION_CLEAR_CLIPBOARD: 'Clear clipboard',
    WEBRADIO_ACTION_START: 'Turn radio on',
    WEBRADIO_ACTION_TOGGLE: 'Turn radio on/off',
    WEBRADIO_ACTION_STOP: 'Turn radio off',
    WEBRADIO_ACTION_NEXT: 'Next radio channel',
    WEBRADIO_ACTION_PREV: 'Previous radio channel',
    WEBRADIO_ACTION_VOLUP: 'Radio volume up',
    WEBRADIO_ACTION_VOLDOWN: 'Radio volume down',
    CONFIRM_IMPORT_BACKUP: 'Caution: This action will delete the existing configuration and replace it with the data from file "{?}". Continue?',
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
    VALIDATION_ERROR_REGEX: 'Username must contain only lowercase letters, digits or the characters  ["-", "_"], valid length is 3-50 characters.',
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
    GridActionWebradio: 'Web-Radio Aktion',
    COLLECT_ACTION_CLEAR: 'Sammelelement leeren',
    COLLECT_ACTION_REMOVE_WORD: 'Letztes Word löschen',
    COLLECT_ACTION_REMOVE_CHAR: 'Letzten Buchstaben löschen',
    COLLECT_ACTION_COPY_CLIPBOARD: 'Text in die Zwischenablage kopieren',
    COLLECT_ACTION_APPEND_CLIPBOARD: 'Text zu Zwischenablage hinzufügen',
    COLLECT_ACTION_CLEAR_CLIPBOARD: 'Zwischenablage leeren',
    WEBRADIO_ACTION_START: 'Radio einschalten',
    WEBRADIO_ACTION_TOGGLE: 'Radio ein-/ausschalten',
    WEBRADIO_ACTION_STOP: 'Radio ausschalten',
    WEBRADIO_ACTION_NEXT: 'Nächster Radiosender',
    WEBRADIO_ACTION_PREV: 'Voriger Radiosender',
    WEBRADIO_ACTION_VOLUP: 'Radio-Lautstärke erhöhen',
    WEBRADIO_ACTION_VOLDOWN: 'Radio-Lautstärke vermindern',
    CONFIRM_IMPORT_BACKUP: 'Achtung: Diese Aktion wird die aktuelle Konfiguration löschen und sie mit den Daten der Datei "{?}" ersetzen. Fortfahren?',
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
    VALIDATION_ERROR_REGEX: 'Username darf nur Kleinbuchstaben, Ziffern und die Zeichen ["-", "_"] enthalten, erlaubte Länge ist 3-50 Zeichen.',
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
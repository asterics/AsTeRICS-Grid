import {localStorageService} from "./data/localStorageService";

let i18nService = {};

let CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let customLanguage = localStorageService.get(CUSTOM_LANGUAGE_KEY);

i18nService.initDomI18n = function () {
    let i18n = window.domI18n({
        selector: '[data-i18n]',
        separator: ' // ',
        languages: ['en', 'de']
    });
    if (customLanguage) {
        i18n.changeLanguage(customLanguage)
    }
};

i18nService.getBrowserLang = function () {
    return customLanguage || navigator.language.substring(0, 2).toLowerCase();
};

i18nService.isBrowserLangDE = function () {
    return i18nService.getBrowserLang() === 'de';
};

i18nService.translate = function (key) {
    var lang = this.translations[this.getBrowserLang()] ? this.getBrowserLang() : 'en';
    var translated = this.translations[lang][key] ? this.translations[lang][key] : key;
    for(var i=1; i<arguments.length; i++) {
        translated = translated.replace('{?}', arguments[i]);
    }
    return translated;
};

window.setLanguage = function (lang) {
    customLanguage = lang;
    localStorageService.save(CUSTOM_LANGUAGE_KEY, customLanguage);
};

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
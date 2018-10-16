var translateService = {};

/**
 *
 */
translateService.getLang = function () {
    return navigator.language.substring(0,2).toLowerCase();
};

translateService.translate = function (key) {
    var lang = this.translations[this.getLang()] ? this.getLang() : 'en';
    var translated = this.translations[lang][key] ? this.translations[lang][key] : key;
    for(var i=1; i<arguments.length; i++) {
        translated = translated.replace('{?}', arguments[i]);
    }
    return translated;
};

translateService.translations = {};
translateService.translations['en'] = {
    GridActionSpeak: 'Speak label',
    GridActionSpeakCustom: 'Speak custom text',
    GridActionNavigate: 'Navigate to other grid',
    CONFIRM_IMPORT_BACKUP: 'Do you really want to restore the backup from "{?}"? Warning: This will delete the current configuration and grids! This operation cannot be undone!',
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

translateService.translations['de'] = {
    GridActionSpeak: 'Label aussprechen',
    GridActionSpeakCustom: 'Benutzerdefinierten Text aussprechen',
    GridActionNavigate: 'Zu anderem Grid navigieren',
    CONFIRM_IMPORT_BACKUP: 'Möchten Sie wirklich das Backup von "{?}" wiederherstellen? Warnung: Diese Aktion wird die aktuelle Konfiguration und alle Grids löschen und kann nicht rückgängig gemacht werden!',
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

export {translateService};
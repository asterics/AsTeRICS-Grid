import $ from 'jquery';
import {localStorageService} from "./data/localStorageService";
import {constants} from "../util/constants";

let i18nService = {};

let CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let customLanguage = localStorageService.get(CUSTOM_LANGUAGE_KEY) || '';
let i18nInstance = null;
let languages = ['en', 'de'];
let separator = ' // ';

//all languages in german and english + ISO-639-1 code, extracted from https://de.wikipedia.org/wiki/Liste_der_ISO-639-1-Codes, sorted by german translation
let allLanguages = JSON.parse('[{"de":"Abchasisch","en":"Abkhazian","code":"ab"},{"de":"Afar","en":"Afar","code":"aa"},{"de":"Afrikaans","en":"Afrikaans","code":"af"},{"de":"Akan","en":"Akan","code":"ak"},{"de":"Albanisch","en":"Albanian","code":"sq"},{"de":"Amharisch","en":"Amharic","code":"am"},{"de":"Arabisch","en":"Arabic","code":"ar"},{"de":"Aragonesisch","en":"Aragonese","code":"an"},{"de":"Armenisch","en":"Armenian","code":"hy"},{"de":"Aserbaidschanisch","en":"Azerbaijani","code":"az"},{"de":"Assamesisch","en":"Assamese","code":"as"},{"de":"Avarisch","en":"Avaric","code":"av"},{"de":"Avestisch","en":"Avestan","code":"ae"},{"de":"Aymara","en":"Aymara","code":"ay"},{"de":"Bambara","en":"Bambara","code":"bm"},{"de":"Baschkirisch","en":"Bashkir","code":"ba"},{"de":"Baskisch","en":"Basque","code":"eu"},{"de":"Bengalisch","en":"Bengali","code":"bn"},{"de":"Bihari","en":"Bihari languages","code":"bh"},{"de":"Birmanisch","en":"Burmese","code":"my"},{"de":"Bislama","en":"Bislama","code":"bi"},{"de":"Bokmål","en":"Norwegian Bokmål","code":"nb"},{"de":"Bosnisch","en":"Bosnian","code":"bs"},{"de":"Bretonisch","en":"Breton","code":"br"},{"de":"Bulgarisch","en":"Bulgarian","code":"bg"},{"de":"Chamorro","en":"Chamorro","code":"ch"},{"de":"Chichewa","en":"Chichewa","code":"ny"},{"de":"Chinesisch","en":"Chinese","code":"zh"},{"de":"Cree","en":"Cree","code":"cr"},{"de":"Dänisch","en":"Danish","code":"da"},{"de":"Deutsch","en":"German","code":"de"},{"de":"Dhivehi","en":"Divehi","code":"dv"},{"de":"Dzongkha","en":"Dzongkha","code":"dz"},{"de":"Englisch","en":"English","code":"en"},{"de":"Esperanto","en":"Esperanto","code":"eo"},{"de":"Estnisch","en":"Estonian","code":"et"},{"de":"Ewe","en":"Ewe","code":"ee"},{"de":"Färöisch","en":"Faroese","code":"fo"},{"de":"Fidschi","en":"Fijian","code":"fj"},{"de":"Finnisch","en":"Finnish","code":"fi"},{"de":"Französisch","en":"French","code":"fr"},{"de":"Fulfulde","en":"Fulah","code":"ff"},{"de":"Galicisch","en":"Galician","code":"gl"},{"de":"Georgisch","en":"Georgian","code":"ka"},{"de":"Griechisch","en":"Greek","code":"el"},{"de":"Grönländisch","en":"Kalaallisut","code":"kl"},{"de":"Guaraní","en":"Guarani","code":"gn"},{"de":"Gujarati","en":"Gujarati","code":"gu"},{"de":"Haitianisch","en":"Haitian","code":"ht"},{"de":"Hausa","en":"Hausa","code":"ha"},{"de":"Hebräisch","en":"Hebrew","code":"he"},{"de":"Hindi","en":"Hindi","code":"hi"},{"de":"Hiri Motu","en":"Hiri Motu","code":"ho"},{"de":"Ido","en":"Ido","code":"io"},{"de":"Igbo","en":"Igbo","code":"ig"},{"de":"Indonesisch","en":"Indonesian","code":"id"},{"de":"Interlingua","en":"Interlingua","code":"ia"},{"de":"Interlingue","en":"Interlingue","code":"ie"},{"de":"Inuktitut","en":"Inuktitut","code":"iu"},{"de":"Inupiaq","en":"Inupiaq","code":"ik"},{"de":"Irisch","en":"Irish","code":"ga"},{"de":"isiXhosa","en":"Xhosa","code":"xh"},{"de":"isiZulu","en":"Zulu","code":"zu"},{"de":"Isländisch","en":"Icelandic","code":"is"},{"de":"Italienisch","en":"Italian","code":"it"},{"de":"Japanisch","en":"Japanese","code":"ja"},{"de":"Javanisch","en":"Javanese","code":"jv"},{"de":"Jiddisch","en":"Yiddish","code":"yi"},{"de":"Kannada","en":"Kannada","code":"kn"},{"de":"Kanuri","en":"Kanuri","code":"kr"},{"de":"Kasachisch","en":"Kazakh","code":"kk"},{"de":"Kashmiri","en":"Kashmiri","code":"ks"},{"de":"Katalanisch","en":"Catalan","code":"ca"},{"de":"Khmer","en":"Central Khmer","code":"km"},{"de":"Kikongo","en":"Kongo","code":"kg"},{"de":"Kikuyu","en":"Kikuyu","code":"ki"},{"de":"Kiluba","en":"Luba-Katanga","code":"lu"},{"de":"Kinyarwanda","en":"Kinyarwanda","code":"rw"},{"de":"Kirchenslawisch","en":"Church Slavic","code":"cu"},{"de":"Kirgisisch","en":"Kirghiz","code":"ky"},{"de":"Kirundi","en":"Rundi","code":"rn"},{"de":"Komi","en":"Komi","code":"kv"},{"de":"Koreanisch","en":"Korean","code":"ko"},{"de":"Kornisch","en":"Cornish","code":"kw"},{"de":"Korsisch","en":"Corsican","code":"co"},{"de":"Kroatisch","en":"Croatian","code":"hr"},{"de":"Kurdisch","en":"Kurdish","code":"ku"},{"de":"Laotisch","en":"Lao","code":"lo"},{"de":"Latein","en":"Latin","code":"la"},{"de":"Lettisch","en":"Latvian","code":"lv"},{"de":"Limburgisch","en":"Limburgan","code":"li"},{"de":"Lingála","en":"Lingala","code":"ln"},{"de":"Litauisch","en":"Lithuanian","code":"lt"},{"de":"Luganda","en":"Ganda","code":"lg"},{"de":"Luxemburgisch","en":"Luxembourgish","code":"lb"},{"de":"Malagasy, Malagassi","en":"Malagasy","code":"mg"},{"de":"Malaiisch","en":"Malay","code":"ms"},{"de":"Malayalam","en":"Malayalam","code":"ml"},{"de":"Maltesisch","en":"Maltese","code":"mt"},{"de":"Manx","en":"Manx","code":"gv"},{"de":"Maori","en":"Maori","code":"mi"},{"de":"Marathi","en":"Marathi","code":"mr"},{"de":"Marshallesisch","en":"Marshallese","code":"mh"},{"de":"Mazedonisch","en":"Macedonian","code":"mk"},{"de":"Mongolisch","en":"Mongolian","code":"mn"},{"de":"Nauruisch","en":"Nauru","code":"na"},{"de":"Navajo","en":"Navajo","code":"nv"},{"de":"Ndonga","en":"Ndonga","code":"ng"},{"de":"Nepali","en":"Nepali","code":"ne"},{"de":"Niederländisch","en":"Dutch","code":"nl"},{"de":"Nord-Ndebele","en":"North Ndebele","code":"nd"},{"de":"Nordsamisch","en":"Northern Sami","code":"se"},{"de":"Norwegisch","en":"Norwegian","code":"no"},{"de":"Nynorsk","en":"Norwegian Nynorsk","code":"nn"},{"de":"Ojibwe","en":"Ojibwa","code":"oj"},{"de":"Okzitanisch","en":"Occitan","code":"oc"},{"de":"Oriya","en":"Oriya","code":"or"},{"de":"Oromo","en":"Oromo","code":"om"},{"de":"oshiKwanyama","en":"Kuanyama","code":"kj"},{"de":"Ossetisch","en":"Ossetian","code":"os"},{"de":"Otjiherero","en":"Herero","code":"hz"},{"de":"Pali","en":"Pali","code":"pi"},{"de":"Panjabi","en":"Panjabi","code":"pa"},{"de":"Paschtunisch","en":"Pashto","code":"ps"},{"de":"Persisch","en":"Persian","code":"fa"},{"de":"Polnisch","en":"Polish","code":"pl"},{"de":"Portugiesisch","en":"Portuguese","code":"pt"},{"de":"Quechua","en":"Quechua","code":"qu"},{"de":"Romanisch","en":"Romansh","code":"rm"},{"de":"Rumänisch","en":"Romanian","code":"ro"},{"de":"Russisch","en":"Russian","code":"ru"},{"de":"Samoanisch","en":"Samoan","code":"sm"},{"de":"Sango","en":"Sango","code":"sg"},{"de":"Sanskrit","en":"Sanskrit","code":"sa"},{"de":"Sardisch","en":"Sardinian","code":"sc"},{"de":"Schottisch-gälisch","en":"Scottish Gaelic","code":"gd"},{"de":"Schwedisch","en":"Swedish","code":"sv"},{"de":"Serbisch","en":"Serbian","code":"sr"},{"de":"Sesotho","en":"Southern Sotho","code":"st"},{"de":"Setswana","en":"Tswana","code":"tn"},{"de":"Shona","en":"Shona","code":"sn"},{"de":"Sindhi","en":"Sindhi","code":"sd"},{"de":"Singhalesisch","en":"Sinhala, Sinhalese","code":"si"},{"de":"Siswati","en":"Swati","code":"ss"},{"de":"Slowakisch","en":"Slovak","code":"sk"},{"de":"Slowenisch","en":"Slovenian","code":"sl"},{"de":"Somali","en":"Somali","code":"so"},{"de":"Spanisch","en":"Spanish","code":"es"},{"de":"Süd-Ndebele","en":"South Ndebele","code":"nr"},{"de":"Sundanesisch","en":"Sundanese","code":"su"},{"de":"Swahili","en":"Swahili","code":"sw"},{"de":"Tadschikisch","en":"Tajik","code":"tg"},{"de":"Tagalog","en":"Tagalog","code":"tl"},{"de":"Tahitianisch","en":"Tahitian","code":"ty"},{"de":"Tamil","en":"Tamil","code":"ta"},{"de":"Tatarisch","en":"Tatar","code":"tt"},{"de":"Telugu","en":"Telugu","code":"te"},{"de":"Thai","en":"Thai","code":"th"},{"de":"Tibetisch","en":"Tibetan","code":"bo"},{"de":"Tigrinya","en":"Tigrinya","code":"ti"},{"de":"Tongaisch","en":"Tonga","code":"to"},{"de":"Tschechisch","en":"Czech","code":"cs"},{"de":"Tschetschenisch","en":"Chechen","code":"ce"},{"de":"Tschuwaschisch","en":"Chuvash","code":"cv"},{"de":"Tshivenda","en":"Venda","code":"ve"},{"de":"Türkisch","en":"Turkish","code":"tr"},{"de":"Turkmenisch","en":"Turkmen","code":"tk"},{"de":"Twi","en":"Twi","code":"tw"},{"de":"Uigurisch","en":"Uighur","code":"ug"},{"de":"Ukrainisch","en":"Ukrainian","code":"uk"},{"de":"Ungarisch","en":"Hungarian","code":"hu"},{"de":"Urdu","en":"Urdu","code":"ur"},{"de":"Usbekisch","en":"Uzbek","code":"uz"},{"de":"Vietnamesisch","en":"Vietnamese","code":"vi"},{"de":"Volapük","en":"Volapük","code":"vo"},{"de":"Walisisch","en":"Welsh","code":"cy"},{"de":"Wallonisch","en":"Walloon","code":"wa"},{"de":"Weißrussisch","en":"Belarusian","code":"be"},{"de":"Westfriesisch","en":"Western Frisian","code":"fy"},{"de":"Wolof","en":"Wolof","code":"wo"},{"de":"Xitsonga","en":"Tsonga","code":"ts"},{"de":"Yi","en":"Sichuan Yi","code":"ii"},{"de":"Yoruba","en":"Yoruba","code":"yo"},{"de":"Zhuang","en":"Zhuang","code":"za"}]')
let currentLanguageOrdering = 'de';

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

i18nService.isBrowserLangEN = function () {
    return i18nService.getBrowserLang() === 'en';
};

/**
 * retrieves array of all languages, ordered by translation of current user language
 * @return {any} array in format [{de: "Deutsch", en: "German", code: "de"}, ...]
 */
i18nService.getAllLanguages = function () {
    let currentLang = i18nService.getBrowserLang() === 'de' ? 'de' : 'en';
    if (currentLang === currentLanguageOrdering) {
        return allLanguages;
    }
    allLanguages.sort((a, b) => (a[currentLang].toLowerCase() > b[currentLang].toLowerCase()) ? 1 : -1);
    currentLanguageOrdering = currentLang;
    return allLanguages;
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
    $(document).trigger(constants.EVENT_LANGUAGE_CHANGE);
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
    GridActionYoutube: 'YouTube action',
    GridActionChangeLang: 'Change app language',
    COLLECT_ACTION_CLEAR: 'Clear collect element',
    COLLECT_ACTION_REMOVE_WORD: 'Delete last word',
    COLLECT_ACTION_REMOVE_CHAR: 'Delete last character',
    COLLECT_ACTION_COPY_CLIPBOARD: 'Copy text to clipboard',
    COLLECT_ACTION_APPEND_CLIPBOARD: 'Append text to clipboard',
    COLLECT_ACTION_CLEAR_CLIPBOARD: 'Clear clipboard',
    COLLECT_ACTION_TO_YOUTUBE: 'Search text on YouTube',
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
    PREVIOUS_ELEMENT: 'Previous Element',
    UP: 'Go up',
    DOWN: 'Go down',
    LEFT: 'Go left',
    RIGHT: 'Go right',
    GENERAL_INPUT: 'Input',
    InputEventKey: 'Keypress',
    InputEventARE: 'AsTeRICS ARE event',
    ELEMENT_TYPE_COLLECT: 'Collect element',
    ELEMENT_TYPE_PREDICTION: 'Prediction element',
    ELEMENT_TYPE_YT_PLAYER: 'YouTube player',
    YT_PLAY: 'Play video',
    YT_PAUSE: 'Pause video',
    YT_TOGGLE: 'Play/pause video',
    YT_RESTART: 'Restart video',
    YT_STOP: 'Stop Video',
    YT_STEP_FORWARD: 'Step forward within video',
    YT_STEP_BACKWARD: 'Step backward within video',
    YT_NEXT_VIDEO: 'Next video',
    YT_PREV_VIDEO: 'Previous video',
    YT_PLAY_VIDEO: 'Play single video',
    YT_PLAY_PLAYLIST: 'Play playlist',
    YT_PLAY_SEARCH: 'Play videos from search query',
    YT_PLAY_CHANNEL: 'Play videos from channel',
    YT_ENTER_FULLSCREEN: 'Show video in fullscreen',
    YT_VOLUME_UP: 'Video volume up',
    YT_VOLUME_DOWN: 'Video volume down',
    YT_VOLUME_MUTE: 'Mute/unmute video'
};

i18nService.translations['de'] = {
    GridActionSpeak: 'Label aussprechen',
    GridActionSpeakCustom: 'Benutzerdefinierten Text aussprechen',
    GridActionNavigate: 'Zu anderem Grid navigieren',
    GridActionARE: 'AsTeRICS Aktion',
    GridActionPredict: 'Vorhersage-Elemente füllen',
    GridActionCollectElement: 'Sammelelement Aktion',
    GridActionWebradio: 'Web-Radio Aktion',
    GridActionYoutube: 'YouTube Aktion',
    GridActionChangeLang: 'Anwendungssprache ändern',
    COLLECT_ACTION_CLEAR: 'Sammelelement leeren',
    COLLECT_ACTION_REMOVE_WORD: 'Letztes Word löschen',
    COLLECT_ACTION_REMOVE_CHAR: 'Letzten Buchstaben löschen',
    COLLECT_ACTION_COPY_CLIPBOARD: 'Text in die Zwischenablage kopieren',
    COLLECT_ACTION_APPEND_CLIPBOARD: 'Text zu Zwischenablage hinzufügen',
    COLLECT_ACTION_CLEAR_CLIPBOARD: 'Zwischenablage leeren',
    COLLECT_ACTION_TO_YOUTUBE: 'Text auf YouTube suchen',
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
    PREVIOUS_ELEMENT: 'Vorheriges Element',
    UP: 'Nach oben',
    DOWN: 'Nach unten',
    LEFT: 'Nach links',
    RIGHT: 'Nach rechts',
    GENERAL_INPUT: 'Eingabe',
    InputEventKey: 'Tastendruck',
    InputEventARE: 'AsTeRICS ARE Event',
    ELEMENT_TYPE_COLLECT: 'Sammel-Element',
    ELEMENT_TYPE_PREDICTION: 'Vorhersage-Element',
    ELEMENT_TYPE_YT_PLAYER: 'YouTube Player',
    YT_PLAY: 'Video abspielen',
    YT_PAUSE: 'Video pausieren',
    YT_TOGGLE: 'Video abspielen/pausieren',
    YT_RESTART: 'Video neu starten',
    YT_STOP: 'Video stoppen',
    YT_STEP_FORWARD: 'Im Video weiterspringen',
    YT_STEP_BACKWARD: 'Im Video zurückspringen',
    YT_NEXT_VIDEO: 'Nächstes Video',
    YT_PREV_VIDEO: 'Vorheriges Video',
    YT_PLAY_VIDEO: 'Einzelnes Video abspielen',
    YT_PLAY_PLAYLIST: 'Playlist abspielen',
    YT_PLAY_SEARCH: 'Videos aus Suchanfrage abspielen',
    YT_PLAY_CHANNEL: 'Videos aus Kanal abspielen',
    YT_ENTER_FULLSCREEN: 'Zeige Video in Vollbild',
    YT_VOLUME_UP: 'Videolautstärke erhöhen',
    YT_VOLUME_DOWN: 'Videolautstärke vermindern',
    YT_VOLUME_MUTE: 'Video stummschalten / Ton einschalten'
};

export {i18nService};
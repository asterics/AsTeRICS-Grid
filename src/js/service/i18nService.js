import $ from '../externals/jquery.js';
import VueI18n from 'vue-i18n';
import { localStorageService } from './data/localStorageService.js';
import { constants } from '../util/constants';

let i18nService = {};

let vueI18n = null;
let loadedLanguages = [];
let fallbackLang = 'en';
let currentContentLang = null;
let currentAppLang = localStorageService.getAppSettings().appLang;

let appLanguages = [
    'cs',
    'en',
    'de',
    'eu',
    'bg',
    'ca',
    'hr',
    'nl',
    'fr',
    'gl',
    'he',
    'hu',
    'it',
    'ko',
    'pl',
    'pt',
    'ro',
    'ru',
    'sl',
    'es',
    'uk',
    'val'
];
//all languages in german and english + ISO-639-1 code, extracted from https://de.wikipedia.org/wiki/Liste_der_ISO-639-1-Codes, sorted by german translation
let allLangCodes = ["aa","ab","ae","af","ak","am","an","ar","ar-ae","ar-bh","ar-dz","ar-eg","ar-iq","ar-jo","ar-kw","ar-lb","ar-ly","ar-ma","ar-om","ar-qa","ar-sa","ar-sy","ar-tn","ar-ye","as","av","ay","az","ba","be","bg","bh","bi","bm","bn","bo","br","bs","ca","ce","ch","co","cr","cs","cu","cv","cy","da","de","de-at","de-ch","de-ch-loc","de-li","de-lu","dv","dz","ee","el","en","en-au","en-bz","en-ca","en-gb","en-ie","en-in","en-jm","en-nz","en-tt","en-us","en-za","eo","es","es-ar","es-bo","es-cl","es-co","es-cr","es-do","es-ec","es-gt","es-hn","es-mx","es-ni","es-pa","es-pe","es-pr","es-py","es-sv","es-uy","es-ve","et","eu","fa","ff","fi","fj","fo","fr","fr-be","fr-ca","fr-ch","fr-lu","fy","ga","gd","gl","gn","gu","gv","ha","he","hi","ho","hr","ht","hu","hy","hz","ia","id","ie","ig","ii","ik","io","is","it","it-ch","iu","ja","ji","jv","ka","kg","ki","kj","kk","kl","km","kn","ko","kr","ks","ku","kv","kw","ky","la","lb","lg","li","ln","lo","lt","lu","lv","mg","mh","mi","mk","ml","mn","mr","ms","mt","my","na","nb","nd","ne","ng","nl","nl-be","nn","no","nr","nv","ny","oc","oj","om","or","os","pa","pi","pl","ps","pt","pt-br","qu","rm","rn","ro","ro-md","ru","ru-md","rw","sa","sb","sc","sd","se","sg","si","sk","sl","sm","sn","so","sq","sr","ss","st","su","sv","sv-fi","sw","ta","te","tg","th","ti","tk","tl","tn","to","tr","ts","tt","tw","ty","ug","uk","ur","uz","val","ve","vi","vo","wa","wo","xh","yi","yo","za","zh","zh-cn","zh-hk","zh-sg","zh-tw","zu"];
let allLanguages = allLangCodes.map((code) => {
    return { code };
}); // dynamically filled array containing data like [{en: "English", de: "Englisch", code: "en"}, ...] of all languages, always sorted by translation of current language

i18nService.getVueI18n = async function () {
    if (vueI18n) {
        return vueI18n;
    }
    vueI18n = new VueI18n({
        locale: i18nService.getAppLang(), // set locale
        fallbackLocale: fallbackLang,
        messages: {}
    });
    await loadLanguage(fallbackLang);
    getUserSettings();
    return i18nService.setAppLanguage(i18nService.getAppLang(), true).then(() => {
        return Promise.resolve(vueI18n);
    });
};

i18nService.getBrowserLang = function () {
    return navigator.language.substring(0, 2).toLowerCase();
};

i18nService.getContentLang = function () {
    return currentContentLang || i18nService.getAppLang();
};

/**
 * returns the current content language, but without country code, e.g. "de" if content lang is "de-at"
 * @return {string|*}
 */
i18nService.getContentLangBase = function () {
    return i18nService.getBaseLang(i18nService.getContentLang());
};

i18nService.getContentLangReadable = function () {
    return i18nService.getLangReadable(i18nService.getContentLang());
};

i18nService.getAppLang = function () {
    return i18nService.getCustomAppLang() || i18nService.getBrowserLang();
};

i18nService.getCustomAppLang = function () {
    return currentAppLang || '';
};

i18nService.isCurrentAppLangDE = function () {
    return i18nService.getAppLang() === 'de';
};

i18nService.isCurrentAppLangEN = function () {
    return i18nService.getAppLang() === 'en';
};

i18nService.isCurrentContentLangEN = function() {
    return i18nService.getContentLangBase() === 'en';
}

/**
 * sets the language code to use (ISO 639-1)
 * @param lang two-letter language code to use
 * @param dontSave if true, passed lang is not saved to local storage
 */
i18nService.setAppLanguage = function (lang, dontSave) {
    if (!dontSave) {
        localStorageService.saveAppSettings({appLang: lang});
    }
    currentAppLang = lang || i18nService.getBrowserLang();
    $('html').prop('lang', currentAppLang);
    return loadLanguage(currentAppLang).then(() => {
        vueI18n.locale = currentAppLang;
        allLanguages.sort((a, b) => a[currentAppLang].toLowerCase().localeCompare(b[currentAppLang].toLowerCase()));
        return Promise.resolve();
    });
};

i18nService.setContentLanguage = async function (lang, dontSave) {
    currentContentLang = lang || undefined;
    if (!dontSave) {
        localStorageService.saveUserSettings({contentLang: currentContentLang})
    }
    return loadLanguage(i18nService.getContentLangBase()); // use promise for return!
};

/**
 * retrieves array of all languages, ordered by translation of current user language
 * @return {any} array in format [{de: "Deutsch", en: "German", code: "de"}, ...]
 */
i18nService.getAllLanguages = function () {
    return JSON.parse(JSON.stringify(allLanguages));
};

i18nService.getAllLangCodes = function() {
    return i18nService.getAllLanguages().map(lang => lang.code);
}

/**
 * retrieves existing app languages translated via crowdin.com
 * @return {any}
 */
i18nService.getAppLanguages = function () {
    return JSON.parse(JSON.stringify(appLanguages));
};

/**
 * gets translation of the given language (e.g. "English")
 * @param lang language code, either only 2 digits (e.g. "en") or localized (e.g. "en-us")
 * @returns {*}
 */
i18nService.getLangReadable = function (lang) {
    let baseLang = i18nService.getBaseLang(lang);
    let langObject = allLanguages.find(object => object.code === lang);
    let baselangObject = allLanguages.find(object => object.code === baseLang) || {};

    return langObject ? langObject[i18nService.getAppLang()] : baselangObject[i18nService.getAppLang()];
};

/**
 * get app translation for the given key in the current app language
 * @param key
 * @param args optional arguments for placeholders within the translation
 * @return {*}
 */
i18nService.t = function (key, ...args) {
    return vueI18n.t(key, i18nService.getAppLang(), args);
};

/**
 * checks if translation exists
 * @param key
 * @return true, if translations exists
 */
i18nService.te = function (key) {
    return vueI18n.te(key, i18nService.getAppLang());
}

/**
 * returns the translation of the first existing given translation key. If no translation is existing, the last
 * key is returned.
 * @param keys
 * @returns {*|string}
 */
i18nService.tFallback = function(...keys) {
    for (let key of keys) {
        if (i18nService.te(key)) {
            return i18nService.t(key);
        }
    }
    return keys.length > 0 ? keys[keys.length - 1] : '';
};

/**
 * get app translation for the given key in the given language
 * @param key
 * @param args optional arguments for placeholders within the translation
 * @param lang target language
 * @return {*}
 */
i18nService.tl = function (key, args, lang) {
    return vueI18n.t(key, lang, args);
};

/**
 * translates a key, but loads current language before translating
 * @param key
 * @returns {Promise<*>}
 */
i18nService.tLoad = async function(key) {
    await loadLanguage(i18nService.getAppLang());
    return i18nService.t(key);
};

/**
 * get plain translation string from an translation object
 * @param i18nObject translation object, e.g. {en: 'english text', de: 'deutscher Text'}
 * @param options
 * @param options.fallbackLang language to use if current browser language not available, default: 'en'
 * @param options.includeLang if true return format is {lang: <languageCode>, text: <translatedText>}
 * @param options.lang language in which the translation is forced to be returned (if available), no exact matching, so "en-us" also matches for "en"
 * @param options.forceLang exact language in which the translation is forced to be returned (if available), exact matching, so "en-us" doesn't match for "en"
 * @param options.noFallback if true nothing is returned if the current content lang / force lang isn't existing in the
 *                           translation object
 * @return {string|*|string} the translated string in current browser language, e.g. 'english text'
 */
i18nService.getTranslation = function (i18nObject, options = {}) {
    if (!i18nObject) {
        return '';
    }
    options.lang = options.lang || '';
    let lang = options.forceLang || options.lang || i18nService.getContentLang();
    let baseLang = options.forceLang || i18nService.getBaseLang(options.lang) || i18nService.getContentLangBase();
    options.fallbackLang = options.fallbackLang || 'en';
    if (typeof i18nObject === 'string') {
        return i18nService.t(i18nObject);
    }
    if (i18nObject[lang]) {
        return !options.includeLang ? i18nObject[lang] : { lang: lang, text: i18nObject[lang] };
    }
    if (i18nObject[baseLang]) {
        return !options.includeLang ? i18nObject[baseLang] : {
            lang: baseLang,
            text: i18nObject[baseLang]
        };
    }

    if (!options.noFallback) {
        if (i18nObject[options.fallbackLang]) {
            return !options.includeLang
                ? `${i18nObject[options.fallbackLang]}`
                : { lang: options.fallbackLang, text: `${i18nObject[options.fallbackLang]}` };
        }

        let keys = Object.keys(i18nObject);
        for (let key of keys) {
            if (i18nObject[key]) {
                return !options.includeLang ? `${i18nObject[key]}` : { lang: key, text: `${i18nObject[key]}` };
            }
        }
    }

    return !options.includeLang ? '' : { lang: undefined, text: '' };
};

i18nService.getTranslationAppLang = function (i18nObject) {
    return i18nService.getTranslation(i18nObject, { forceLang: i18nService.getAppLang() });
};

/**
 * turns a given label to a translation object
 * @param label plain string label
 * @param locale locale of the string (2 chars, ISO 639-1)
 * @return translation object, e.g. {en: 'given label'}
 */
i18nService.getTranslationObject = function (label, locale) {
    locale = locale || i18nService.getContentLang();
    let object = {};
    object[locale] = label;
    return object;
};

/**
 * returns the base lang code of a localized language code including a country code.
 * e.g. for "en-us" the base lang is "en"
 *
 * @param langCode
 * @returns {string|*}
 */
i18nService.getBaseLang = function(langCode = '') {
    // not using simple substring(0,2) because there is also "val" (Valencian) as base lang
    let delimiterIndex = langCode.search(/[^A-Za-z]/); // index of first non-alphabetic character (= delimiter, "dash" in most cases)
    return delimiterIndex !== -1 ? langCode.substring(0, delimiterIndex) : langCode;
}

/**
 * get country code from a language code
 * e.g. "en-us" => country code is "us"
 *
 * @param langCode
 * @returns {string|*}
 */
i18nService.getCountryCode = function(langCode) {
    let delimiterIndex = langCode.search(/[^A-Za-z]/); // index of first non-alphabetic character (= delimiter, "dash" in most cases)
    return delimiterIndex !== -1 ? langCode.substring(delimiterIndex + 1) : '';
};

async function loadLanguage(useLang, secondTry) {
    if (!useLang || loadedLanguages.includes(useLang)) {
        return;
    }
    let url = 'app/lang/i18n.' + useLang + '.json';
    try {
        let messages = await $.get(url);
        loadedLanguages.push(useLang);
        vueI18n.setLocaleMessage(useLang, messages);
    } catch (e) {
        if (!secondTry) {
            await loadLanguage(fallbackLang, true);
        }
        return;
    }
    allLanguages.forEach((elem) => {
        if (!elem[useLang]) {
            let langCode = i18nService.getBaseLang(elem.code);
            let countryCode = i18nService.getCountryCode(elem.code);
            elem[useLang] = i18nService.tl(`lang.${langCode}`, [], useLang);
            if (countryCode) {
                elem[useLang] = `${elem[useLang]}, ${i18nService.tl(`country.${countryCode}`, [], useLang)}`
            }
        }
    });
    let module = await import("./serviceWorkerService.js");
    module.serviceWorkerService.cacheUrl(url);
}

async function getUserSettings() {
    let userSettings = localStorageService.getUserSettings();
    currentContentLang = userSettings.contentLang;
    loadLanguage(i18nService.getContentLangBase());
}

$(document).on(constants.EVENT_USER_CHANGED, getUserSettings);

export { i18nService };

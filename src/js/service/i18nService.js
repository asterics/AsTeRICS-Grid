import $ from '../externals/jquery.js';
import VueI18n from 'vue-i18n';
import {localStorageService} from "./data/localStorageService.js";
import {constants} from "../util/constants";
import {dataService} from "./data/dataService.js";
import {serviceWorkerService} from "./serviceWorkerService.js";

let i18nService = {};

let CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let vueI18n = null;
let loadedLanguages = [];
let fallbackLang = 'en';
let currentContentLang = null;

let appLanguages = ['en', 'de', 'eu', 'bg', 'ca', 'hr', 'fr', 'gl', 'he', 'hu', 'it', 'ko', 'pl', 'pt', 'sl', 'es', 'uk', 'val'];
//all languages in german and english + ISO-639-1 code, extracted from https://de.wikipedia.org/wiki/Liste_der_ISO-639-1-Codes, sorted by german translation
let allLangCodes = ["ab", "aa", "af", "ak", "sq", "am", "ar", "an", "hy", "az", "as", "av", "ae", "ay", "bm", "ba", "eu", "bn", "bh", "my", "bi", "nb", "bs", "br", "bg", "ch", "ny", "zh", "cr", "da", "de", "dv", "dz", "en", "eo", "et", "ee", "fo", "fj", "fi", "fr", "ff", "gl", "ka", "el", "kl", "gn", "gu", "ht", "ha", "he", "hi", "ho", "io", "ig", "id", "ia", "ie", "iu", "ik", "ga", "xh", "zu", "is", "it", "ja", "jv", "yi", "kn", "kr", "kk", "ks", "ca", "km", "kg", "ki", "lu", "rw", "cu", "ky", "rn", "kv", "ko", "kw", "co", "hr", "ku", "lo", "la", "lv", "li", "ln", "lt", "lg", "lb", "mg", "ms", "ml", "mt", "gv", "mi", "mr", "mh", "mk", "mn", "na", "nv", "ng", "ne", "nl", "nd", "se", "no", "nn", "oj", "oc", "or", "om", "kj", "os", "hz", "pi", "pa", "ps", "fa", "pl", "pt", "qu", "rm", "ro", "ru", "sm", "sg", "sa", "sc", "gd", "sv", "sr", "st", "tn", "sn", "sd", "si", "ss", "sk", "sl", "so", "es", "nr", "su", "sw", "tg", "tl", "ty", "ta", "tt", "te", "th", "bo", "ti", "to", "cs", "ce", "cv", "ve", "tr", "tk", "tw", "ug", "uk", "hu", "ur", "uz", "val", "vi", "vo", "cy", "wa", "be", "fy", "wo", "ts", "ii", "yo", "za"];
let allLanguages = allLangCodes.map(code => {return {code}}); // dynamically filled array containing data like [{en: "English", de: "Englisch", code: "en"}, ...] of all languages, always sorted by translation of current language

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
    getMetadataConfig();
    return i18nService.setAppLanguage(i18nService.getAppLang(), true).then(() => {
        return Promise.resolve(vueI18n);
    });
}

i18nService.getBrowserLang = function () {
    return navigator.language.substring(0, 2).toLowerCase();
};

i18nService.getContentLang = function () {
    return currentContentLang || i18nService.getAppLang();
};

i18nService.getContentLangReadable = function () {
    return i18nService.getLangReadable(i18nService.getContentLang());
}

i18nService.getAppLang = function () {
    return i18nService.getCustomAppLang() || i18nService.getBrowserLang();
};

i18nService.getCustomAppLang = function () {
    return localStorageService.get(CUSTOM_LANGUAGE_KEY) || '';
};

i18nService.isCurrentAppLangDE = function () {
    return i18nService.getAppLang() === 'de';
};

i18nService.isCurrentAppLangEN = function () {
    return i18nService.getAppLang() === 'en';
};

/**
 * sets the language code to use (ISO 639-1)
 * @param lang two-letter language code to use
 * @param dontSave if true, passed lang is not saved to local storage
 */
i18nService.setAppLanguage = function (lang, dontSave) {
    if (!dontSave) {
        localStorageService.save(CUSTOM_LANGUAGE_KEY, lang);
    }
    let useLang = lang || i18nService.getBrowserLang();
    $('html').prop('lang', useLang);
    return loadLanguage(useLang).then(() => {
        vueI18n.locale = useLang;
        allLanguages.sort((a, b) => (a[useLang].toLowerCase() > b[useLang].toLowerCase()) ? 1 : -1);
        return Promise.resolve();
    });
};

i18nService.setContentLanguage = async function (lang, dontSave) {
    currentContentLang = lang || undefined;
    loadLanguage(currentContentLang);
    if (!dontSave) {
        let metadata = await dataService.getMetadata();
        metadata.localeConfig.contentLang = lang;
        return dataService.saveMetadata(metadata);
    }
}

/**
 * retrieves array of all languages, ordered by translation of current user language
 * @return {any} array in format [{de: "Deutsch", en: "German", code: "de"}, ...]
 */
i18nService.getAllLanguages = function () {
    return JSON.parse(JSON.stringify(allLanguages));
};

/**
 * retrieves existing app languages translated via crowdin.com
 * @return {any}
 */
i18nService.getAppLanguages = function () {
    return JSON.parse(JSON.stringify(appLanguages));
};

i18nService.getLangReadable = function (lang) {
    for (let langObject of allLanguages) {
        if (lang === langObject.code) {
            return langObject[i18nService.getAppLang()];
        }
    }
    return '';
}

/**
 * get app translation for the given key in the current app language
 * @param key
 * @param args optional arguments for placeholders within the translation
 * @return {*}
 */
i18nService.t = function (key, ...args) {
    return vueI18n.t(key, i18nService.getAppLang(), args);
}

/**
 * get app translation for the given key in the given language
 * @param key
 * @param args optional arguments for placeholders within the translation
 * @param lang target language
 * @return {*}
 */
i18nService.tl = function (key, args, lang) {
    return vueI18n.t(key, lang, args);
}

/**
 * get plain translation string from an translation object
 * @param i18nObject translation object, e.g. {en: 'english text', de: 'deutscher Text'}
 * @param fallbackLang language to use if current browser language not available, default: 'en'
 * @param includeLang if true return format is {lang: <languageCode>, text: <translatedText>}
 * @param forceLang language in which the translation is forced to be returned (if available)
 * @return {string|*|string} the translated string in current browser language, e.g. 'english text'
 */
i18nService.getTranslation = function (i18nObject, fallbackLang, includeLang, forceLang) {
    if (!i18nObject) {
        return '';
    }
    let lang = forceLang || i18nService.getContentLang();
    fallbackLang = fallbackLang || 'en';
    if (typeof i18nObject === 'string') {
        return i18nService.t(i18nObject);
    }
    if (i18nObject[lang]) {
        return !includeLang ? i18nObject[lang] : {lang: lang, text: i18nObject[lang]};
    }
    if (i18nObject[fallbackLang]) {
        return !includeLang ? `${i18nObject[fallbackLang]}` : {lang: fallbackLang, text: `${i18nObject[fallbackLang]}`};
    }

    let keys = Object.keys(i18nObject);
    for (let key of keys) {
        if (i18nObject[key]) {
            return !includeLang ? `${i18nObject[key]}` : {lang: key, text: `${i18nObject[key]}`};
        }
    }

    return !includeLang ? '' : {lang: undefined, text: ''};
};

i18nService.getTranslationAppLang = function (i18nObject) {
    return i18nService.getTranslation(i18nObject, null, null, i18nService.getAppLang());
}

/**
 * turns a given label to a translation object
 * @param label plain string label
 * @param locale locale of the string (2 chars, ISO 639-1)
 * @return translation object, e.g. {en: 'given label'}
 */
i18nService.getTranslationObject = function(label, locale) {
    locale = locale || i18nService.getContentLang();
    let object = {};
    object[locale] = label;
    return object;
};

function loadLanguage(useLang, secondTry) {
    if (!useLang) {
        return Promise.resolve();
    }
    return new Promise(resolve => {
        if (loadedLanguages.includes(useLang)) {
            resolve();
        } else {
            let url = 'app/lang/i18n.' + useLang + '.json';
            $.get(url).then(messages => {
                loadedLanguages.push(useLang)
                vueI18n.setLocaleMessage(useLang, messages);
            }).fail(() => {
                if (!secondTry) {
                    loadLanguage(fallbackLang, true).finally(resolve);
                } else {
                    resolve();
                }
            }).then(() => {
                allLanguages.forEach(elem => {
                    if (!elem[useLang]) {
                        elem[useLang] = i18nService.tl(`lang.${elem.code}`, [], useLang);
                    }
                });
                serviceWorkerService.cacheUrl(url);
                resolve();
            })
        }
    });
}

async function getMetadataConfig() {
    let metadata = await dataService.getMetadata();
    currentContentLang = metadata.localeConfig.contentLang;
    loadLanguage(currentContentLang);
}

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);

export {i18nService};
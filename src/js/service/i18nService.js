import $ from '../externals/jquery.js';
import VueI18n from 'vue-i18n';
import {localStorageService} from "./data/localStorageService";
import {constants} from "../util/constants";

let i18nService = {};

let CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let vueI18n = null;
let loadedLanguages = [];
let fallbackLang = 'en';

//all languages in german and english + ISO-639-1 code, extracted from https://de.wikipedia.org/wiki/Liste_der_ISO-639-1-Codes, sorted by german translation
let allLangCodes = ["ab", "aa", "af", "ak", "sq", "am", "ar", "an", "hy", "az", "as", "av", "ae", "ay", "bm", "ba", "eu", "bn", "bh", "my", "bi", "nb", "bs", "br", "bg", "ch", "ny", "zh", "cr", "da", "de", "dv", "dz", "en", "eo", "et", "ee", "fo", "fj", "fi", "fr", "ff", "gl", "ka", "el", "kl", "gn", "gu", "ht", "ha", "he", "hi", "ho", "io", "ig", "id", "ia", "ie", "iu", "ik", "ga", "xh", "zu", "is", "it", "ja", "jv", "yi", "kn", "kr", "kk", "ks", "ca", "km", "kg", "ki", "lu", "rw", "cu", "ky", "rn", "kv", "ko", "kw", "co", "hr", "ku", "lo", "la", "lv", "li", "ln", "lt", "lg", "lb", "mg", "ms", "ml", "mt", "gv", "mi", "mr", "mh", "mk", "mn", "na", "nv", "ng", "ne", "nl", "nd", "se", "no", "nn", "oj", "oc", "or", "om", "kj", "os", "hz", "pi", "pa", "ps", "fa", "pl", "pt", "qu", "rm", "ro", "ru", "sm", "sg", "sa", "sc", "gd", "sv", "sr", "st", "tn", "sn", "sd", "si", "ss", "sk", "sl", "so", "es", "nr", "su", "sw", "tg", "tl", "ty", "ta", "tt", "te", "th", "bo", "ti", "to", "cs", "ce", "cv", "ve", "tr", "tk", "tw", "ug", "uk", "hu", "ur", "uz", "vi", "vo", "cy", "wa", "be", "fy", "wo", "ts", "ii", "yo", "za"];
let allLanguages = allLangCodes.map(code => {return {code}}); // dynamically filled array containing data like [{en: "English", de: "Englisch", code: "en"}, ...] of all languages, always sorted by translation of current language

i18nService.getVueI18n = async function () {
    if (vueI18n) {
        return vueI18n;
    }
    vueI18n = new VueI18n({
        locale: i18nService.getCurrentLang(), // set locale
        fallbackLocale: fallbackLang,
        messages: {}
    });
    await loadLanguage(fallbackLang);
    return i18nService.setLanguage(i18nService.getCurrentLang(), true).then(() => {
        return Promise.resolve(vueI18n);
    });
}

i18nService.t = function (key, ...args) {
    return vueI18n.t(key, i18nService.getCurrentLang(), args);
}

i18nService.getBrowserLang = function () {
    return navigator.language.substring(0, 2).toLowerCase();
};

i18nService.getCurrentLang = function () {
    return i18nService.getCustomLanguage() || i18nService.getBrowserLang();
};

i18nService.isCurrentLangDE = function () {
    return i18nService.getCurrentLang() === 'de';
};

i18nService.isCurrentLangEN = function () {
    return i18nService.getCurrentLang() === 'en';
};

/**
 * retrieves array of all languages, ordered by translation of current user language
 * @return {any} array in format [{de: "Deutsch", en: "German", code: "de"}, ...]
 */
i18nService.getAllLanguages = function () {
    return allLanguages;
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
        return i18nService.t(i18nObject);
    }
    let currentLang = i18nService.getCurrentLang();
    if (i18nObject[currentLang]) {
        return !includeLang ? i18nObject[currentLang] : {lang: currentLang, text: i18nObject[currentLang]};
    }
    if (i18nObject[fallbackLang]) {
        return !includeLang ? i18nObject[fallbackLang] : {lang: fallbackLang, text: i18nObject[fallbackLang]};
    }
    /*let keys = Object.keys(i18nObject);
    if (i18nObject[keys[0]]) {
        return !includeLang ? i18nObject[keys[0]] : {lang: keys[0], text: i18nObject[keys[0]]};
    }*/
    return !includeLang ? '' : {lang: undefined, text: ''};
};

/**
 * turns a given label to a translation object
 * @param label plain string label
 * @param locale locale of the string (2 chars, ISO 639-1)
 * @return translation object, e.g. {en: 'given label'}
 */
i18nService.getTranslationObject = function(label, locale) {
    locale = locale || i18nService.getCurrentLang();
    let object = {};
    object[locale] = label;
    return object;
};

/**
 * sets the language code to use (ISO 639-1)
 * @param lang two-letter language code to use
 * @param dontSave if true, passed lang is not saved to local storage
 */
i18nService.setLanguage = function (lang, dontSave) {
    if (!dontSave) {
        localStorageService.save(CUSTOM_LANGUAGE_KEY, lang);
    }
    let useLang = lang || i18nService.getBrowserLang();
    $('html').prop('lang', useLang);
    return loadLanguage(useLang).then(() => {
        vueI18n.locale = useLang;
        $(document).trigger(constants.EVENT_LANGUAGE_CHANGE);
        allLanguages.forEach(elem => {
            if (!elem[useLang]) {
                elem[useLang] = i18nService.t(`lang.${elem.code}`);
            }
        });
        allLanguages.sort((a, b) => (a[useLang].toLowerCase() > b[useLang].toLowerCase()) ? 1 : -1);
        return Promise.resolve();
    });
};

function loadLanguage(useLang, secondTry) {
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
                navigator.serviceWorker.addEventListener("message", (evt) => {
                    if (evt.data && evt.data.activated) {
                        navigator.serviceWorker.controller.postMessage({
                            urlToAdd: url
                        });
                    }
                });
                resolve();
            })
        }
    });
}

/**
 * retrieves the language code previously set with setLanguage().
 */
i18nService.getCustomLanguage = function () {
    return localStorageService.get(CUSTOM_LANGUAGE_KEY) || '';
};

export {i18nService};
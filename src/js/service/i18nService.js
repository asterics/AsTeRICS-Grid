import $ from '../externals/jquery.js';
import VueI18n from 'vue-i18n';
import de from '../../lang/i18n.de.json';
import en from '../../lang/i18n.en.json';
import es from '../../lang/i18n.es.json';
import {localStorageService} from "./data/localStorageService";
import {constants} from "../util/constants";

let i18nService = {};

let CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let customLanguage = localStorageService.get(CUSTOM_LANGUAGE_KEY) || '';
let vueI18n = null;
let loadedLanguages = ['en', 'de', 'es'];

//all languages in german and english + ISO-639-1 code, extracted from https://de.wikipedia.org/wiki/Liste_der_ISO-639-1-Codes, sorted by german translation
let allLangCodes = ["ab", "aa", "af", "ak", "sq", "am", "ar", "an", "hy", "az", "as", "av", "ae", "ay", "bm", "ba", "eu", "bn", "bh", "my", "bi", "nb", "bs", "br", "bg", "ch", "ny", "zh", "cr", "da", "de", "dv", "dz", "en", "eo", "et", "ee", "fo", "fj", "fi", "fr", "ff", "gl", "ka", "el", "kl", "gn", "gu", "ht", "ha", "he", "hi", "ho", "io", "ig", "id", "ia", "ie", "iu", "ik", "ga", "xh", "zu", "is", "it", "ja", "jv", "yi", "kn", "kr", "kk", "ks", "ca", "km", "kg", "ki", "lu", "rw", "cu", "ky", "rn", "kv", "ko", "kw", "co", "hr", "ku", "lo", "la", "lv", "li", "ln", "lt", "lg", "lb", "mg", "ms", "ml", "mt", "gv", "mi", "mr", "mh", "mk", "mn", "na", "nv", "ng", "ne", "nl", "nd", "se", "no", "nn", "oj", "oc", "or", "om", "kj", "os", "hz", "pi", "pa", "ps", "fa", "pl", "pt", "qu", "rm", "ro", "ru", "sm", "sg", "sa", "sc", "gd", "sv", "sr", "st", "tn", "sn", "sd", "si", "ss", "sk", "sl", "so", "es", "nr", "su", "sw", "tg", "tl", "ty", "ta", "tt", "te", "th", "bo", "ti", "to", "cs", "ce", "cv", "ve", "tr", "tk", "tw", "ug", "uk", "hu", "ur", "uz", "vi", "vo", "cy", "wa", "be", "fy", "wo", "ts", "ii", "yo", "za"];
let allLanguages = allLangCodes.map(code => {return {code}}); // dynamically filled array containing data like [{en: "English", de: "Englisch", code: "en"}, ...] of all languages, always sorted by translation of current language

i18nService.getVueI18n = function () {
    if (vueI18n) {
        return vueI18n;
    }
    vueI18n = new VueI18n({
        locale: i18nService.getCurrentLang(), // set locale
        messages: {de, en, es}
    });
    i18nService.setLanguage(i18nService.getCurrentLang());
    return vueI18n;
}

i18nService.t = function (key, ...args) {
    return vueI18n.t(key, i18nService.getCurrentLang(), args);
}

i18nService.getBrowserLang = function () {
    return navigator.language.substring(0, 2).toLowerCase();
};

i18nService.getCurrentLang = function () {
    return customLanguage || i18nService.getBrowserLang();
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
        return i18nObject;
    }
    let currentLang = i18nService.getCurrentLang();
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
    locale = locale || i18nService.getCurrentLang();
    let object = {};
    object[locale] = label;
    return object;
};

/**
 * sets the language code to use (ISO 639-1)
 * @param lang two-letter language code to use
 */
i18nService.setLanguage = function (lang) {
    lang = lang || i18nService.getBrowserLang();
    if (loadedLanguages.includes(lang)) {
        setNewLang(lang);
    } else {
        import(`../../lang/i18n.${lang}.json`).then(
            messages => {
                loadedLanguages.push(lang)
                vueI18n.setLocaleMessage(lang, messages.default)
            }
        ).finally(() => {
            setNewLang(lang);
        })
    }
    function setNewLang(lang) {
        customLanguage = lang;
        vueI18n.locale = lang;
        $(document).trigger(constants.EVENT_LANGUAGE_CHANGE);
        localStorageService.save(CUSTOM_LANGUAGE_KEY, customLanguage);
        allLanguages.forEach(elem => {
            if (!elem[lang]) {
                elem[lang] = i18nService.t(`lang.${elem.code}`);
            }
        });
        allLanguages.sort((a, b) => (a[lang].toLowerCase() > b[lang].toLowerCase()) ? 1 : -1);
    }
};

/**
 * retrieves the language code previously set with setLanguage().
 */
i18nService.getCustomLanguage = function () {
    return customLanguage;
};

export {i18nService};
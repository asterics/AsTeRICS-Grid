import $ from '../externals/jquery.js';
import VueI18n from 'vue-i18n';
import de from '../../lang/i18n.de.js';
import en from '../../lang/i18n.en.js';
import {localStorageService} from "./data/localStorageService";
import {constants} from "../util/constants";

let i18nService = {};
i18nService.translations = {};
i18nService.translations['en'] = en;
i18nService.translations['de'] = de;

let CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let customLanguage = localStorageService.get(CUSTOM_LANGUAGE_KEY) || '';
let vueI18n = null;

//all languages in german and english + ISO-639-1 code, extracted from https://de.wikipedia.org/wiki/Liste_der_ISO-639-1-Codes, sorted by german translation
let allLanguages = JSON.parse('[{"de":"Abchasisch","en":"Abkhazian","code":"ab"},{"de":"Afar","en":"Afar","code":"aa"},{"de":"Afrikaans","en":"Afrikaans","code":"af"},{"de":"Akan","en":"Akan","code":"ak"},{"de":"Albanisch","en":"Albanian","code":"sq"},{"de":"Amharisch","en":"Amharic","code":"am"},{"de":"Arabisch","en":"Arabic","code":"ar"},{"de":"Aragonesisch","en":"Aragonese","code":"an"},{"de":"Armenisch","en":"Armenian","code":"hy"},{"de":"Aserbaidschanisch","en":"Azerbaijani","code":"az"},{"de":"Assamesisch","en":"Assamese","code":"as"},{"de":"Avarisch","en":"Avaric","code":"av"},{"de":"Avestisch","en":"Avestan","code":"ae"},{"de":"Aymara","en":"Aymara","code":"ay"},{"de":"Bambara","en":"Bambara","code":"bm"},{"de":"Baschkirisch","en":"Bashkir","code":"ba"},{"de":"Baskisch","en":"Basque","code":"eu"},{"de":"Bengalisch","en":"Bengali","code":"bn"},{"de":"Bihari","en":"Bihari languages","code":"bh"},{"de":"Birmanisch","en":"Burmese","code":"my"},{"de":"Bislama","en":"Bislama","code":"bi"},{"de":"Bokmål","en":"Norwegian Bokmål","code":"nb"},{"de":"Bosnisch","en":"Bosnian","code":"bs"},{"de":"Bretonisch","en":"Breton","code":"br"},{"de":"Bulgarisch","en":"Bulgarian","code":"bg"},{"de":"Chamorro","en":"Chamorro","code":"ch"},{"de":"Chichewa","en":"Chichewa","code":"ny"},{"de":"Chinesisch","en":"Chinese","code":"zh"},{"de":"Cree","en":"Cree","code":"cr"},{"de":"Dänisch","en":"Danish","code":"da"},{"de":"Deutsch","en":"German","code":"de"},{"de":"Dhivehi","en":"Divehi","code":"dv"},{"de":"Dzongkha","en":"Dzongkha","code":"dz"},{"de":"Englisch","en":"English","code":"en"},{"de":"Esperanto","en":"Esperanto","code":"eo"},{"de":"Estnisch","en":"Estonian","code":"et"},{"de":"Ewe","en":"Ewe","code":"ee"},{"de":"Färöisch","en":"Faroese","code":"fo"},{"de":"Fidschi","en":"Fijian","code":"fj"},{"de":"Finnisch","en":"Finnish","code":"fi"},{"de":"Französisch","en":"French","code":"fr"},{"de":"Fulfulde","en":"Fulah","code":"ff"},{"de":"Galicisch","en":"Galician","code":"gl"},{"de":"Georgisch","en":"Georgian","code":"ka"},{"de":"Griechisch","en":"Greek","code":"el"},{"de":"Grönländisch","en":"Kalaallisut","code":"kl"},{"de":"Guaraní","en":"Guarani","code":"gn"},{"de":"Gujarati","en":"Gujarati","code":"gu"},{"de":"Haitianisch","en":"Haitian","code":"ht"},{"de":"Hausa","en":"Hausa","code":"ha"},{"de":"Hebräisch","en":"Hebrew","code":"he"},{"de":"Hindi","en":"Hindi","code":"hi"},{"de":"Hiri Motu","en":"Hiri Motu","code":"ho"},{"de":"Ido","en":"Ido","code":"io"},{"de":"Igbo","en":"Igbo","code":"ig"},{"de":"Indonesisch","en":"Indonesian","code":"id"},{"de":"Interlingua","en":"Interlingua","code":"ia"},{"de":"Interlingue","en":"Interlingue","code":"ie"},{"de":"Inuktitut","en":"Inuktitut","code":"iu"},{"de":"Inupiaq","en":"Inupiaq","code":"ik"},{"de":"Irisch","en":"Irish","code":"ga"},{"de":"isiXhosa","en":"Xhosa","code":"xh"},{"de":"isiZulu","en":"Zulu","code":"zu"},{"de":"Isländisch","en":"Icelandic","code":"is"},{"de":"Italienisch","en":"Italian","code":"it"},{"de":"Japanisch","en":"Japanese","code":"ja"},{"de":"Javanisch","en":"Javanese","code":"jv"},{"de":"Jiddisch","en":"Yiddish","code":"yi"},{"de":"Kannada","en":"Kannada","code":"kn"},{"de":"Kanuri","en":"Kanuri","code":"kr"},{"de":"Kasachisch","en":"Kazakh","code":"kk"},{"de":"Kashmiri","en":"Kashmiri","code":"ks"},{"de":"Katalanisch","en":"Catalan","code":"ca"},{"de":"Khmer","en":"Central Khmer","code":"km"},{"de":"Kikongo","en":"Kongo","code":"kg"},{"de":"Kikuyu","en":"Kikuyu","code":"ki"},{"de":"Kiluba","en":"Luba-Katanga","code":"lu"},{"de":"Kinyarwanda","en":"Kinyarwanda","code":"rw"},{"de":"Kirchenslawisch","en":"Church Slavic","code":"cu"},{"de":"Kirgisisch","en":"Kirghiz","code":"ky"},{"de":"Kirundi","en":"Rundi","code":"rn"},{"de":"Komi","en":"Komi","code":"kv"},{"de":"Koreanisch","en":"Korean","code":"ko"},{"de":"Kornisch","en":"Cornish","code":"kw"},{"de":"Korsisch","en":"Corsican","code":"co"},{"de":"Kroatisch","en":"Croatian","code":"hr"},{"de":"Kurdisch","en":"Kurdish","code":"ku"},{"de":"Laotisch","en":"Lao","code":"lo"},{"de":"Latein","en":"Latin","code":"la"},{"de":"Lettisch","en":"Latvian","code":"lv"},{"de":"Limburgisch","en":"Limburgan","code":"li"},{"de":"Lingála","en":"Lingala","code":"ln"},{"de":"Litauisch","en":"Lithuanian","code":"lt"},{"de":"Luganda","en":"Ganda","code":"lg"},{"de":"Luxemburgisch","en":"Luxembourgish","code":"lb"},{"de":"Malagasy, Malagassi","en":"Malagasy","code":"mg"},{"de":"Malaiisch","en":"Malay","code":"ms"},{"de":"Malayalam","en":"Malayalam","code":"ml"},{"de":"Maltesisch","en":"Maltese","code":"mt"},{"de":"Manx","en":"Manx","code":"gv"},{"de":"Maori","en":"Maori","code":"mi"},{"de":"Marathi","en":"Marathi","code":"mr"},{"de":"Marshallesisch","en":"Marshallese","code":"mh"},{"de":"Mazedonisch","en":"Macedonian","code":"mk"},{"de":"Mongolisch","en":"Mongolian","code":"mn"},{"de":"Nauruisch","en":"Nauru","code":"na"},{"de":"Navajo","en":"Navajo","code":"nv"},{"de":"Ndonga","en":"Ndonga","code":"ng"},{"de":"Nepali","en":"Nepali","code":"ne"},{"de":"Niederländisch","en":"Dutch","code":"nl"},{"de":"Nord-Ndebele","en":"North Ndebele","code":"nd"},{"de":"Nordsamisch","en":"Northern Sami","code":"se"},{"de":"Norwegisch","en":"Norwegian","code":"no"},{"de":"Nynorsk","en":"Norwegian Nynorsk","code":"nn"},{"de":"Ojibwe","en":"Ojibwa","code":"oj"},{"de":"Okzitanisch","en":"Occitan","code":"oc"},{"de":"Oriya","en":"Oriya","code":"or"},{"de":"Oromo","en":"Oromo","code":"om"},{"de":"oshiKwanyama","en":"Kuanyama","code":"kj"},{"de":"Ossetisch","en":"Ossetian","code":"os"},{"de":"Otjiherero","en":"Herero","code":"hz"},{"de":"Pali","en":"Pali","code":"pi"},{"de":"Panjabi","en":"Panjabi","code":"pa"},{"de":"Paschtunisch","en":"Pashto","code":"ps"},{"de":"Persisch","en":"Persian","code":"fa"},{"de":"Polnisch","en":"Polish","code":"pl"},{"de":"Portugiesisch","en":"Portuguese","code":"pt"},{"de":"Quechua","en":"Quechua","code":"qu"},{"de":"Romanisch","en":"Romansh","code":"rm"},{"de":"Rumänisch","en":"Romanian","code":"ro"},{"de":"Russisch","en":"Russian","code":"ru"},{"de":"Samoanisch","en":"Samoan","code":"sm"},{"de":"Sango","en":"Sango","code":"sg"},{"de":"Sanskrit","en":"Sanskrit","code":"sa"},{"de":"Sardisch","en":"Sardinian","code":"sc"},{"de":"Schottisch-gälisch","en":"Scottish Gaelic","code":"gd"},{"de":"Schwedisch","en":"Swedish","code":"sv"},{"de":"Serbisch","en":"Serbian","code":"sr"},{"de":"Sesotho","en":"Southern Sotho","code":"st"},{"de":"Setswana","en":"Tswana","code":"tn"},{"de":"Shona","en":"Shona","code":"sn"},{"de":"Sindhi","en":"Sindhi","code":"sd"},{"de":"Singhalesisch","en":"Sinhala, Sinhalese","code":"si"},{"de":"Siswati","en":"Swati","code":"ss"},{"de":"Slowakisch","en":"Slovak","code":"sk"},{"de":"Slowenisch","en":"Slovenian","code":"sl"},{"de":"Somali","en":"Somali","code":"so"},{"de":"Spanisch","en":"Spanish","code":"es"},{"de":"Süd-Ndebele","en":"South Ndebele","code":"nr"},{"de":"Sundanesisch","en":"Sundanese","code":"su"},{"de":"Swahili","en":"Swahili","code":"sw"},{"de":"Tadschikisch","en":"Tajik","code":"tg"},{"de":"Tagalog","en":"Tagalog","code":"tl"},{"de":"Tahitianisch","en":"Tahitian","code":"ty"},{"de":"Tamil","en":"Tamil","code":"ta"},{"de":"Tatarisch","en":"Tatar","code":"tt"},{"de":"Telugu","en":"Telugu","code":"te"},{"de":"Thai","en":"Thai","code":"th"},{"de":"Tibetisch","en":"Tibetan","code":"bo"},{"de":"Tigrinya","en":"Tigrinya","code":"ti"},{"de":"Tongaisch","en":"Tonga","code":"to"},{"de":"Tschechisch","en":"Czech","code":"cs"},{"de":"Tschetschenisch","en":"Chechen","code":"ce"},{"de":"Tschuwaschisch","en":"Chuvash","code":"cv"},{"de":"Tshivenda","en":"Venda","code":"ve"},{"de":"Türkisch","en":"Turkish","code":"tr"},{"de":"Turkmenisch","en":"Turkmen","code":"tk"},{"de":"Twi","en":"Twi","code":"tw"},{"de":"Uigurisch","en":"Uighur","code":"ug"},{"de":"Ukrainisch","en":"Ukrainian","code":"uk"},{"de":"Ungarisch","en":"Hungarian","code":"hu"},{"de":"Urdu","en":"Urdu","code":"ur"},{"de":"Usbekisch","en":"Uzbek","code":"uz"},{"de":"Vietnamesisch","en":"Vietnamese","code":"vi"},{"de":"Volapük","en":"Volapük","code":"vo"},{"de":"Walisisch","en":"Welsh","code":"cy"},{"de":"Wallonisch","en":"Walloon","code":"wa"},{"de":"Weißrussisch","en":"Belarusian","code":"be"},{"de":"Westfriesisch","en":"Western Frisian","code":"fy"},{"de":"Wolof","en":"Wolof","code":"wo"},{"de":"Xitsonga","en":"Tsonga","code":"ts"},{"de":"Yi","en":"Sichuan Yi","code":"ii"},{"de":"Yoruba","en":"Yoruba","code":"yo"},{"de":"Zhuang","en":"Zhuang","code":"za"}]')
let currentLanguageOrdering = 'de';

i18nService.getVueI18n = function () {
    if (vueI18n) {
        return vueI18n;
    }
    vueI18n = new VueI18n({
        locale: i18nService.getBrowserLang(), // set locale
        messages: {de, en}
    });
    /*log.warn(en);
    let printEn = '';
    let printDe = '';
    Object.keys(en).forEach(key => {
        let text = en[key];
        if(text.includes(' // ')) {
            let en = text.split(' // ')[0];
            let de = text.split(' // ')[1];
            let apo = en.includes('\'') ? '"' : "'";
            printEn += `${key}: ${apo+en+apo},\n`
            apo = de.includes('\'') ? '"' : "'";
            printDe += `${key}: ${apo+de+apo},\n`
        } else {
            let apo = text.includes('\'') ? '"' : "'";
            printEn += `${key}: ${apo+text+apo},\n`;
            let deTxt = de[key] || text;
            apo = deTxt.includes('\'') ? '"' : "'";
            printDe += `${key}: ${apo + deTxt + apo},\n`
        }
    });
    log.info(printEn);
    log.info(printDe);*/

    return vueI18n;
}

i18nService.t = function (key, ...args) {
    return vueI18n.t(key, i18nService.getBrowserLang(), args);
}

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

i18nService.translateLangCode = function (code) {
    let object = allLanguages.filter(l => l.code === code)[0];
    let lang = i18nService.isBrowserLangDE() ? 'de' : 'en';
    return object ? object[lang] : code;
}

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
    vueI18n.locale = lang;
    localStorageService.save(CUSTOM_LANGUAGE_KEY, customLanguage);
    $(document).trigger(constants.EVENT_LANGUAGE_CHANGE);
};

/**
 * retrieves the language code previously set with setLanguage().
 */
i18nService.getCustomLanguage = function () {
    return customLanguage;
};

export {i18nService};
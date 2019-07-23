import {localStorageService} from "./service/data/localStorageService";

let I18nModule = {};
let CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let customLanguage = localStorageService.get(CUSTOM_LANGUAGE_KEY);

I18nModule.init = function () {
    let i18n = window.domI18n({
        selector: '[data-i18n]',
        separator: ' // ',
        languages: ['en', 'de']
    });
    if (customLanguage) {
        i18n.changeLanguage(customLanguage)
    }
};

I18nModule.getBrowserLang = function () {
    return customLanguage || navigator.language.substring(0, 2);
};

I18nModule.isBrowserLangDE = function () {
    return I18nModule.getBrowserLang() === 'de';
};

window.setLanguage = function (lang) {
    customLanguage = lang;
    localStorageService.save(CUSTOM_LANGUAGE_KEY, customLanguage);
};

export {I18nModule};
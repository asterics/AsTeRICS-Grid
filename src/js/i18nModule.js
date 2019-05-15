let I18nModule = {};

I18nModule.init = function () {
    window.domI18n({
        selector: '[data-i18n]',
        separator: ' // ',
        languages: ['en', 'de']
    });
};

I18nModule.getBrowserLang = function () {
    return navigator.language.substring(0, 2);
};

I18nModule.isBrowserLangDE = function () {
    return I18nModule.getBrowserLang() === 'de';
};

export {I18nModule};
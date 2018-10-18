var I18nModule = {};

I18nModule.init = function () {
    domI18n({
        selector: '[data-i18n]',
        separator: ' // ',
        languages: ['en', 'de']
    });
};

export {I18nModule};
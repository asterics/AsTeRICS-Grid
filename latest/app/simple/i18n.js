window.i18n = {};
i18n.translatePage = function () {
    var nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach(function (node) {
        var key = node.getAttribute('data-i18n');
        node.innerHTML = i18n.translate(key);
    })
};

i18n.translate = function (key) {
    var lang = i18n.getLang();
    var translations = i18n.translations[lang];
    return translations && translations[key] ? translations[key] : key;
};

i18n.getLang = function () {
    var lang = window.navigator.userLanguage || window.navigator.language;
    return lang.substring(0,2);
};

i18n.translations = {};
i18n.translations['en'] = {
    'FULL_MODE' : 'Full Mode',
    'START_SCAN' : 'Start Scanning',
    'STOP_SCAN' : 'Stop Scanning',
    'SCAN_SPEED' : 'Speed:'
};

i18n.translations['de'] = {
    'FULL_MODE' : 'Vollständiger Modus',
    'START_SCAN' : 'Scanning starten',
    'STOP_SCAN' : 'Scanning stoppen',
    'SCAN_SPEED' : 'Geschwindigkeit:'
};
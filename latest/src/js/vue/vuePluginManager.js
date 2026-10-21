import Vue from 'vue';
import { i18nService } from '../service/i18nService';

let VuePluginManager = {};
let timeoutID = null;

VuePluginManager.init = function () {
    initDirectives();
    initFilters();
};

function initDirectives() {
    Vue.directive('focus', {
        inserted: function (el, binding) {
            if (binding.value || binding.value === undefined) {
                if (el.focus) el.focus();
                if (el.select) el.select();
            }
        },
        updated: function (el, binding) {
            if (binding.value) {
                if (el.focus) el.focus();
                if (el.select) el.select();
            }
        }
    });
    Vue.directive('debounce', {
        inserted: function (el, binding) {
            el.oninput = function (evt) {
                clearTimeout(timeoutID);
                timeoutID = setTimeout(function () {
                    el.dispatchEvent(new Event('change'));
                }, parseInt(binding.value) || 500);
            };
        }
    });
}

function initFilters() {
    Vue.filter('translate', function (key) {
        return i18nService.t(key);
    });
    Vue.filter('extractTranslation', function (object) {
        return i18nService.getTranslation(object);
    });
    Vue.filter('extractTranslationAppLang', function (object) {
        return i18nService.getTranslationAppLang(object);
    });
}

export { VuePluginManager };

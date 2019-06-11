import Vue from 'vue'
import {translateService} from "../service/translateService";
import {I18nModule} from "../i18nModule";

let VueHandler = {};
let timeoutID = null;
let mainVue = null;

VueHandler.init = function () {
    initDirectives();
    initFilters();
    initMainVue();
};

VueHandler.setViewComponent = function (component, properties) {
    mainVue.setComponent(component, properties);
};

function initMainVue() {
    mainVue = new Vue({
        el: '#app',
        data() {
            return {
                component: null,
                properties: null,
                componentKey: 0,
                showSidebar: true
            }
        },
        methods: {
            setComponent(component, properties) {
                this.component = component;
                this.properties = properties;
                this.componentKey++; //forces to update the view, even with same component (e.g. grid view, other page)
            }
        },
        mounted() {
            I18nModule.init();
        },
        updated() {
            I18nModule.init();
        }
    });
}

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
                    el.dispatchEvent(new Event('change'))
                }, parseInt(binding.value) || 500);
            }
        }
    });
}

function initFilters() {
    Vue.filter('translate', function (key) {
        return translateService.translate(key);
    })
}

export {VueHandler}

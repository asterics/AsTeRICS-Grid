import Vue from 'vue'
import {translateService} from "../service/translateService";
//import Vuesax from 'vuesax'
//import 'vuesax/dist/vuesax.css'
import { vsButton, vsSelect, vsPopup } from 'vuesax'
import 'vuesax/dist/vuesax.css'

let VuePlugins = {};
let timeoutID = null;

VuePlugins.init = function () {
    initDirectives();
    initFilters();
    //Vue.use(Vuesax);
    Vue.use(vsButton);
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

export {VuePlugins}

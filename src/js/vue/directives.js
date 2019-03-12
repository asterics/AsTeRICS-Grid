import Vue from 'vue'
import {translateService} from "../service/translateService";

let timeoutID = null;

var VueDirectives = {
    init: () => {
        Vue.directive('focus', {
            inserted: function (el) {
                if(el.focus) el.focus();
                if(el.select) el.select();
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
        Vue.filter('translate', function (key) {
            return translateService.translate(key);
        })
    }
};

export {VueDirectives}

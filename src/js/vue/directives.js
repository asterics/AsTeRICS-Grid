import Vue from 'vue'
import {translateService} from "../service/translateService";

var VueDirectives = {
    init: () => {
        Vue.directive('focus', {
            inserted: function (el) {
                if(el.focus) el.focus();
                if(el.select) el.select();
            }
        });
        Vue.filter('translate', function (key) {
            return translateService.translate(key);
        })
    }
};

export {VueDirectives}

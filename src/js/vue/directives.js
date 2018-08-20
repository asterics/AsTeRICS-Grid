import Vue from 'vue'

var VueDirectives = {
    init: () =>{
        Vue.directive('focus', {
            inserted: function (el) {
                el.select()
            }
        });
    }
};

export {VueDirectives}

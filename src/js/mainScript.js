import {Router} from "./router.js";
import {VueDirectives} from "./vue/directives";

function init() {
   Router.init('#content');
   VueDirectives.init();
}
init();
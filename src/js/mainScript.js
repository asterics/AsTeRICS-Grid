import {Router} from "./router.js";
import {VueDirectives} from "./vue/directives";

import './../css/custom.css';
import './../css/gridlist.css';
import './../css/jquery.contextMenu.css';
import './../../node_modules/@fortawesome/fontawesome-free/css/all.css';

function init() {
   Router.init('#content');
   VueDirectives.init();
}
init();
import {Router} from "./router.js";
import {VueDirectives} from "./vue/directives";

import './../css/custom.css';
import './../css/gridlist.css';
import './../css/jquery.contextMenu.css';
import './../css/allGridsView.css';

function init() {
    Router.init('#content');
    VueDirectives.init();
    reloadOnAppcacheUpdate();
}
init();

function reloadOnAppcacheUpdate() {
    function onUpdateReady() {
        console.log('appcache: updateready');
        window.location.reload();
    }

    window.applicationCache.addEventListener('updateready', onUpdateReady);
    window.applicationCache.addEventListener('checking', function () {
        console.log('appcache: checking');
    });
    window.applicationCache.addEventListener('downloading', function () {
        console.log('appcache: downloading');
    });
    window.applicationCache.addEventListener('progress', function () {
        console.log('appcache: progress');
    });
    window.applicationCache.addEventListener('error', function (event) {
        console.log('appcache: error');
        console.log(event);
    });
    window.applicationCache.addEventListener('obsolete', function () {
        console.log('appcache: obsolete');
    });
    window.applicationCache.addEventListener('cached', function () {
        console.log('appcache: cached');
    });
    window.applicationCache.addEventListener('noupdate', function () {
        console.log('appcache: noupdate');
    });
    window.applicationCache.addEventListener('updateready', function () {
        console.log('appcache: updateready');
    });

    if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
        onUpdateReady();
    }
}
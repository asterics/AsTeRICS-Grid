import {Router} from "./router.js";
import {VueDirectives} from "./vue/directives";

import './../css/custom.css';
import './../css/gridlist.css';
import './../css/jquery.contextMenu.css';
import './../css/allGridsView.css';

function init() {
    log.setLevel(log.levels.INFO);
    Router.init('#content');
    VueDirectives.init();
    reloadOnAppcacheUpdate();
}
init();

function reloadOnAppcacheUpdate() {
    function onUpdateReady() {
        log.info('appcache: updateready');
        window.location.reload();
    }

    window.applicationCache.addEventListener('updateready', onUpdateReady);
    window.applicationCache.addEventListener('checking', function () {
        log.debug('appcache: checking');
    });
    window.applicationCache.addEventListener('downloading', function () {
        log.debug('appcache: downloading');
    });
    window.applicationCache.addEventListener('progress', function () {
        log.debug('appcache: progress');
    });
    window.applicationCache.addEventListener('error', function (event) {
        log.debug('appcache: error');
        log.debug(event);
    });
    window.applicationCache.addEventListener('obsolete', function () {
        log.debug('appcache: obsolete');
    });
    window.applicationCache.addEventListener('cached', function () {
        log.debug('appcache: cached');
    });
    window.applicationCache.addEventListener('noupdate', function () {
        log.debug('appcache: noupdate');
    });
    window.applicationCache.addEventListener('updateready', function () {
        log.debug('appcache: updateready');
    });

    if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
        onUpdateReady();
    }
}
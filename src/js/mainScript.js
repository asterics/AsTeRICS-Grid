import {Router} from "./router.js";
import {VueDirectives} from "./vue/directives";
import {logger} from "./util/logger";

import './../css/custom.css';
import './../css/gridlist.css';
import './../css/jquery.contextMenu.css';
import './../css/allGridsView.css';

function init() {
    Router.init('#content');
    VueDirectives.init();
    logger.installGlobal(logger.LOGLEVEL_WARN);
    reloadOnAppcacheUpdate();
}
init();

function reloadOnAppcacheUpdate() {
    function onUpdateReady() {
        logger.info('appcache: updateready');
        window.location.reload();
    }

    window.applicationCache.addEventListener('updateready', onUpdateReady);
    window.applicationCache.addEventListener('checking', function () {
        logger.debug('appcache: checking');
    });
    window.applicationCache.addEventListener('downloading', function () {
        logger.debug('appcache: downloading');
    });
    window.applicationCache.addEventListener('progress', function () {
        logger.debug('appcache: progress');
    });
    window.applicationCache.addEventListener('error', function (event) {
        logger.debug('appcache: error');
        logger.debug(event);
    });
    window.applicationCache.addEventListener('obsolete', function () {
        logger.debug('appcache: obsolete');
    });
    window.applicationCache.addEventListener('cached', function () {
        logger.debug('appcache: cached');
    });
    window.applicationCache.addEventListener('noupdate', function () {
        logger.debug('appcache: noupdate');
    });
    window.applicationCache.addEventListener('updateready', function () {
        logger.debug('appcache: updateready');
    });

    if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
        onUpdateReady();
    }
}
import $ from 'jquery';
import {localStorageService} from "./service/data/localStorageService.js";
import {Router} from "./router.js";
import {VueDirectives} from "./vue/directives";

import './../css/custom.css';
import './../css/gridlist.css';
import './../css/jquery.contextMenu.css';
import './../css/allGridsView.css';

var firstRun = localStorageService.isFirstPageVisit();

function init() {
    log.setLevel(log.levels.INFO);
    log.info('AsTeRICS Grid, release version: ' + '#ASTERICS_GRID_VERSION#');
    Router.init('#content');
    VueDirectives.init();
    reloadOnAppcacheUpdate();
}
init();

function reloadOnAppcacheUpdate() {
    if(!window.applicationCache) {
        log.info('no application cache.');
        return;
    }

    function onUpdateReady() {
        log.info('appcache: updateready');
        Router.toMain();
        window.location.reload();
    }

    window.applicationCache.addEventListener('updateready', onUpdateReady);
    window.applicationCache.addEventListener('checking', function () {
        log.debug('appcache: checking');
    });
    window.applicationCache.addEventListener('downloading', function () {
        log.debug('appcache: downloading');
        if(!firstRun) {
            Router.toUpdating();
        }
    });
    window.applicationCache.addEventListener('progress', function (event) {
        log.debug('appcache: progress');
        if(!firstRun) {
            $('#updatePercent').html(Math.ceil(event.loaded * 100 / event.total));
        }
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
        onUpdateReady();
    });
    window.applicationCache.addEventListener('noupdate', function () {
        log.debug('appcache: noupdate');
    });

    if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
        onUpdateReady();
    }
}
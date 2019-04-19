import $ from 'jquery';
import {localStorageService} from "./service/data/localStorageService.js";
import {Router} from "./router.js";
import {VueDirectives} from "./vue/directives";

import './../css/gridlist.css';
import './../css/jquery.contextMenu.css';
import {loginService} from "./service/loginService";
import {databaseService} from "./service/data/databaseService";

var firstRun = localStorageService.isFirstPageVisit();

function init() {
    let promises = [];
    log.setLevel(log.levels.INFO);
    log.info('AsTeRICS Grid, release version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/#ASTERICS_GRID_VERSION#');
    VueDirectives.init();
    reloadOnAppcacheUpdate();
    let lastActiveUser = localStorageService.getLastActiveUser();
    let autologinUser = localStorageService.getAutologinUser();
    let userPassword = localStorageService.getUserPassword(autologinUser);
    log.info('autologin user: ' + autologinUser);
    log.debug('using password (hashed): ' + userPassword);
    if (autologinUser && userPassword) { //saved online user
        promises.push(loginService.loginHashedPassword(autologinUser, userPassword, true));
    }
    if (autologinUser && !userPassword) { //saved local user
        promises.push(databaseService.initForUser(autologinUser));
    }
    Promise.all(promises).finally(() => {
        let initHash = location.hash || (autologinUser ? '#main' : lastActiveUser ? '#login' : '#welcome');
        if (!Router.isInitialized()) {
            Router.init('#content', initHash);
        }
    });
}
init();

function reloadOnAppcacheUpdate() {
    if (!window.applicationCache) {
        log.debug('no application cache.');
        return;
    }

    function onUpdateReady() {
        log.debug('appcache: updateready');
        if (!firstRun) {
            Router.toMain();
            window.location.reload();
        }
    }

    window.applicationCache.addEventListener('updateready', onUpdateReady);
    window.applicationCache.addEventListener('checking', function () {
        log.debug('appcache: checking');
    });
    window.applicationCache.addEventListener('downloading', function () {
        log.debug('appcache: downloading');
        if (!firstRun) {
            if (!Router.isInitialized()) {
                Router.init('#content', '#updating');
            } else {
                Router.toUpdating();
            }
        }
    });
    window.applicationCache.addEventListener('progress', function (event) {
        log.debug('appcache: progress');
        if (!firstRun) {
            $('#updatePercentWrapper').show();
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
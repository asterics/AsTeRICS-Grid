import $ from 'jquery';
import {localStorageService} from "./service/data/localStorageService.js";
import {Router} from "./router.js";
import {VuePluginManager} from "./vue/vuePluginManager";
import {MainVue} from "./vue/mainVue";

import './../css/gridlist.css';
import './../css/jquery.contextMenu.css';
import './../css/holy-grail.css';
import {loginService} from "./service/loginService";
import {databaseService} from "./service/data/databaseService";
//import {timingLogger} from "./service/timingLogger";

var firstRun = localStorageService.isFirstPageVisit();

function init() {
    let promises = [];
    //timingLogger.initLogging();
    log.setLevel(log.levels.INFO);
    log.info('AsTeRICS Grid, release version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/#ASTERICS_GRID_VERSION#');
    reloadOnAppcacheUpdate();
    loginService.ping();
    VuePluginManager.init();
    let lastActiveUser = localStorageService.getLastActiveUser();
    let autologinUser = localStorageService.getAutologinUser();
    let userPassword = localStorageService.getUserPassword(autologinUser);
    log.info('autologin user: ' + autologinUser);
    log.debug('using password (hashed): ' + userPassword);
    if (autologinUser && userPassword) { //saved online user
        promises.push(loginService.loginHashedPassword(autologinUser, userPassword, true));
    }
    if (autologinUser && !userPassword) { //saved local user
        promises.push(databaseService.initForUser(autologinUser, autologinUser));
    }
    Promise.all(promises).finally(() => {
        MainVue.init();
        let initHash = location.hash || (autologinUser ? '#main' : lastActiveUser ? '#login' : '#welcome');
        if (!Router.isInitialized()) {
            Router.init('#injectView', initHash);
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
            Router.init('#app', '#updating');
        }
    });
    window.applicationCache.addEventListener('progress', function (event) {
        log.debug('appcache: progress');
        if (!firstRun) {
            Router.init('#app', '#updating');
            let percent = Math.ceil(event.loaded * 100 / event.total);
            if (typeof percent === 'number') {
                $('#updatePercentWrapper').show();
                $('#updatePercent').html(Math.ceil(event.loaded * 100 / event.total));
            }
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
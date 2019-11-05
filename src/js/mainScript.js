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
import {urlParamService} from "./service/urlParamService";
import {constants} from "./util/constants";
import {modelUtil} from "./util/modelUtil";
import {keyboardShortcuts} from "./service/keyboardShortcuts";
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
    keyboardShortcuts.init();
    let lastActiveUser = localStorageService.getLastActiveUser();
    let autologinUser = localStorageService.getAutologinUser();
    if (localStorageService.getUserMajorModelVersion(autologinUser) > modelUtil.getLatestModelVersion().major) {
        log.info(`data model version of user "${autologinUser}" is newer than version of running AsTeRICS Grid -> prevent autologin.`);
        autologinUser = null;
        localStorageService.setAutologinUser('');
    }
    log.info('autologin user: ' + autologinUser);
    if (urlParamService.isDemoMode()) {
        promises.push(databaseService.registerForUser(constants.LOCAL_DEMO_USERNAME, constants.LOCAL_DEMO_USERNAME));
        localStorageService.saveLocalUser(constants.LOCAL_DEMO_USERNAME);
        localStorageService.setAutologinUser('');
    } else {
        promises.push(loginService.loginStoredUser(autologinUser, true));
    }
    Promise.all(promises).finally(() => {
        MainVue.init();
        let toMain = autologinUser || urlParamService.isDemoMode();
        let toLogin = lastActiveUser || localStorageService.getSavedUsers().length > 0;
        localStorageService.setLastActiveUser(autologinUser || lastActiveUser || '');
        let initHash = location.hash || (toMain ? '#main' : toLogin ? '#login' : '#welcome');
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
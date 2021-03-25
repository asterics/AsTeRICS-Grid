import $ from 'jquery';
import {localStorageService} from "./service/data/localStorageService.js";
import {Router} from "./router.js";
import {VuePluginManager} from "./vue/vuePluginManager";
import {MainVue} from "./vue/mainVue";

import './../css/gridlist.css';
import './../css/jquery.contextMenu.css';
import './../css/holy-grail.css';
import {loginService} from "./service/loginService";
import {urlParamService} from "./service/urlParamService";
import {constants} from "./util/constants";
import {modelUtil} from "./util/modelUtil";
import {keyboardShortcuts} from "./service/keyboardShortcuts";
import {i18nService} from "./service/i18nService";
import {printService} from "./service/printService";
//import {timingLogger} from "./service/timingLogger";

let SERVICE_WORKER_UPDATE_CHECK_INTERVAL = 1000 * 60 * 15; // 15 Minutes

function init() {
    let promises = [];
    //timingLogger.initLogging();
    log.setLevel(log.levels.INFO);
    log.info('AsTeRICS Grid, release version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/' + constants.CURRENT_VERSION);
    checkAppVersion();
    initServiceWorker();
    initMatomoAnalytics();
    printService.initPrintHandlers();
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
        promises.push(loginService.registerOffline(constants.LOCAL_DEMO_USERNAME, constants.LOCAL_DEMO_USERNAME));
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

function initServiceWorker() {
    if (!constants.IS_ENVIRONMENT_PROD) {
        log.warn('Not installing Service Worker because on development environment.')
        return;
    }
    if ('serviceWorker' in navigator) {
        if (window.loaded) {
            installServiceWorker();
        } else {
            // Use the window load event to keep the page load performant
            window.addEventListener('load', () => {
                installServiceWorker();
            });
        }
    }

    function installServiceWorker() {
        navigator.serviceWorker.register('./serviceWorker.js').then(reg => {
            let isUpdate = false;
            setInterval(() => {
                log.debug('Check for serviceworker update...');
                reg.update();
            }, SERVICE_WORKER_UPDATE_CHECK_INTERVAL);
            reg.addEventListener('updatefound', function () {
                if (navigator.serviceWorker.controller) {
                    isUpdate = true;
                }
            });
            navigator.serviceWorker.addEventListener("message", (evt) => {
                if (isUpdate && evt.data && evt.data.activated) {
                    MainVue.setTooltipI18n("New version available! The next time you re-open AsTeRICS Grid you'll automatically use the updated version. // Neue Version verfügbar! Beim nächsten Start von AsTeRICS Grid verwenden Sie automatisch die neue Version.", {
                        closeOnNavigate: false,
                        actionLink: 'Update now // Jetzt aktualisieren',
                        actionLinkFn: () => {
                            window.location.reload();
                        },
                        msgType: 'info'
                    })
                }
            });
        });
    }
}

function checkAppVersion() {
    let version = localStorageService.getCurrentAppVersion();
    if (version && version !== constants.CURRENT_VERSION) {
        let showMsg = () => {
            let text = i18nService.translate("You're now using new Version '{?}'. // Sie verwenden nun die neue Version '{?}'.", constants.CURRENT_VERSION)
            MainVue.setTooltip(text, {
                closeOnNavigate: true,
                timeout: 30000,
                actionLink: 'More information // Mehr Informationen',
                actionLinkUrl: 'https://github.com/asterics/AsTeRICS-Grid/releases/tag/' + constants.CURRENT_VERSION,
                msgType: 'info'
            });
            $(document).off(constants.EVENT_GRID_LOADED, showMsg);
        }
        $(document).on(constants.EVENT_GRID_LOADED, showMsg);
    }
    localStorageService.setCurrentAppVersion(constants.CURRENT_VERSION);
}

function initMatomoAnalytics() {
    if (!constants.IS_ENVIRONMENT_PROD) {
        log.warn('Not doing analytics because on development environment.')
        return;
    }

    var _paq = window._paq = window._paq || [];
    /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
    _paq.push(["setDoNotTrack", true]);
    _paq.push(["disableCookies"]);
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
        var u="//analytics.wbt.wien/";
        _paq.push(['setTrackerUrl', u+'matomo.php']);
        _paq.push(['setSiteId', '5']);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
    })();
}
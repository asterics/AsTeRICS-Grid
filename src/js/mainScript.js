import $ from './externals/jquery.js';
import { localStorageService } from './service/data/localStorageService.js';
import { Router } from './router.js';
import { VuePluginManager } from './vue/vuePluginManager';
import { MainVue } from './vue/mainVue';

import './../css/gridlist.css';
import './../css/jquery.contextMenu.css';
import './../css/holy-grail.css';
import { loginService } from './service/loginService';
import { urlParamService } from './service/urlParamService';
import { constants } from './util/constants';
import { modelUtil } from './util/modelUtil';
import { keyboardShortcuts } from './service/keyboardShortcuts';
import { printService } from './service/printService';
import { notificationService } from './service/notificationService.js';
import { dataService } from './service/data/dataService';
import { consoleReService } from './service/consoleReService';

let SERVICE_WORKER_UPDATE_CHECK_INTERVAL = 1000 * 60 * 15; // 15 Minutes

async function init() {
    let promises = [];
    //timingLogger.initLogging();
    log.setLevel(log.levels.INFO);
    log.info(
        'AsTeRICS Grid, release version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/' +
            constants.CURRENT_VERSION
    );
    consoleReService.init();
    checkAppVersion();
    initServiceWorker();
    initMatomoAnalytics();
    printService.initPrintHandlers();
    VuePluginManager.init();
    keyboardShortcuts.init();
    notificationService.init();
    await MainVue.init();
    let lastActiveUser = localStorageService.getLastActiveUser();
    let autologinUser = localStorageService.getAutologinUser();

    let gridsetFilename = urlParamService.getParam(urlParamService.params.PARAM_USE_GRIDSET_FILENAME)
    if (gridsetFilename) {
        urlParamService.removeParam(urlParamService.params.PARAM_USE_GRIDSET_FILENAME);
        let autoUserSettings = localStorageService.getAutoImportedUserSettings();
        let matchingUserConfig = autoUserSettings.find(settings => settings.originGridsetFilename === gridsetFilename);
        if (matchingUserConfig) {
            autologinUser = matchingUserConfig.username;
        } else {
            let emptyAutoUser = autoUserSettings.find(settings => settings.isEmpty) || {};
            let newUsername = emptyAutoUser.username || localStorageService.getNextAutoUserName();
            if (!emptyAutoUser.username) {
                await loginService.registerOffline(newUsername, newUsername);
            } else {
                await loginService.loginStoredUser(newUsername, true)
            }
            await dataService.importBackupDefaultFile(gridsetFilename);
            autologinUser = newUsername;
        }
    }

    if (!modelUtil.hasValidMajorModelVersion(autologinUser)) {
        log.info(
            `data model version of user "${autologinUser}" is newer than version of running AsTeRICS Grid -> prevent autologin.`
        );
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
    Promise.all(promises)
        .finally(() => {
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
    if (!constants.IS_ENVIRONMENT_PROD && !constants.FORCE_USE_SW) {
        log.warn('Not installing Service Worker because on development environment.');
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
    } else {
        MainVue.setTooltipAfterNavigation('browserNotSupportingOfflineMode', { msgType: 'warn', translate: true, timeout: 15000 });
    }

    function installServiceWorker() {
        if (!navigator.serviceWorker) {
            log.warn('ServiceWorker not supported!');
            return;
        }
        navigator.serviceWorker.register('./serviceWorker.js', {
            updateViaCache: 'none'
        }).then((reg) => {
            setInterval(() => {
                log.debug('Check for serviceworker update...');
                reg.update();
            }, SERVICE_WORKER_UPDATE_CHECK_INTERVAL);

            if (reg.waiting) showUpdateNotification(reg);

            reg.addEventListener('updatefound', function () {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification(reg);
                    }
                });
            });
        });
    }
}

function showUpdateNotification(reg) {
    MainVue.setTooltip('newVersionAvailableTheNextTimeYoullUseUpdated', {
        translate: true,
        closeOnNavigate: false,
        actionLink: 'updateNow',
        actionLinkFn: () => {
            if (reg && reg.waiting) {
                // 1. Set up a one-time listener for the takeover
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                }, { once: true });

                // 2. Tell the waiting worker to skip
                reg.waiting.postMessage({ type: constants.SW_EVENT_SKIP_WAITING });
            } else {
                // Fallback: If for some reason there is no waiting worker, just reload
                window.location.reload();
            }
        },
        msgType: 'info'
    });
}

function checkAppVersion() {
    let version = localStorageService.getCurrentAppVersion();
    if (version && version !== constants.CURRENT_VERSION) {
        MainVue.setTooltipAfterNavigation("youreNowUsingVersion", {
            closeOnNavigate: true,
            translate: true,
            translateParams: [constants.CURRENT_VERSION],
            timeout: 30000,
            actionLink: 'moreInformation',
            actionLinkUrl: 'https://github.com/asterics/AsTeRICS-Grid/releases/tag/' + constants.CURRENT_VERSION,
            msgType: 'info'
        });
    }
    localStorageService.setCurrentAppVersion(constants.CURRENT_VERSION);
}

function initMatomoAnalytics() {
    if (!constants.IS_ENVIRONMENT_PROD) {
        log.warn('Not doing analytics because on development environment.');
        return;
    }

    var _paq = (window._paq = window._paq || []);
    /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
    _paq.push(['setDoNotTrack', true]);
    _paq.push(['disableCookies']);
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function () {
        var u = '//analytics.wbt.wien/';
        _paq.push(['setTrackerUrl', u + 'matomo.php']);
        _paq.push(['setSiteId', '5']);
        var d = document,
            g = d.createElement('script'),
            s = d.getElementsByTagName('script')[0];
        g.type = 'text/javascript';
        g.async = true;
        g.src = u + 'matomo.js';
        s.parentNode.insertBefore(g, s);
    })();
}

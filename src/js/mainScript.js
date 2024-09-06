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
import { i18nService } from './service/i18nService';
import { printService } from './service/printService';
import { notificationService } from './service/notificationService.js';
import { dataService } from './service/data/dataService';
import { oauthService } from './service/oauth/oauthService';
import { externalBoardsService } from './service/boards/externalBoardsService';

let SERVICE_WORKER_UPDATE_CHECK_INTERVAL = 1000 * 60 * 15; // 15 Minutes

async function init() {
    let promises = [];
    //timingLogger.initLogging();
    log.setLevel(log.levels.INFO);
    log.info(
        'AsTeRICS Grid, release version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/' +
            constants.CURRENT_VERSION
    );
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

    let urlImportProps = urlParamService.getImportGridsetProps();
    if (urlImportProps) {
        urlParamService.removeImportGridsetProps();
        if (!urlImportProps.singleBoards) {
            let autoUserSettings = localStorageService.getAutoImportedUserSettings();
            // also checking only for id for legacy reasons
            let matchingUserConfig = autoUserSettings.find(settings => settings.originGridsetFilename === urlImportProps.id || settings.originGridsetFilename === (urlImportProps.provider + urlImportProps.id));
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
                await dataService.importExternalBackup(urlImportProps.provider, urlImportProps.id);
                autologinUser = newUsername;
            }
        } else if (urlImportProps.singleBoards) {
            let selectedPreview = await externalBoardsService.getPreview(urlImportProps.provider, urlImportProps.id);
            localStorageService.setRedirectTarget(constants.REDIRECT_IMPORT_DATA_ONLINE, {selectedPreview: selectedPreview});
            log.warn("set target", selectedPreview)
        }
    }

    if (localStorageService.getUserMajorModelVersion(autologinUser) > modelUtil.getLatestModelVersion().major) {
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
    let oauthPromise = oauthService.processCallbackData();
    promises.push(oauthPromise);
    Promise.all(promises)
        .finally(async () => {
            localStorageService.setLastActiveUser(autologinUser || lastActiveUser || '');
            if (!Router.isInitialized()) {
                Router.init('#injectView');
            }
            let redirectTarget = localStorageService.getRedirectTarget();
            if (redirectTarget) {
                localStorageService.removeRedirectTarget();
                Router.toRedirectTarget(redirectTarget);
            } else {
                let toMain = autologinUser || urlParamService.isDemoMode();
                let toLogin = lastActiveUser || localStorageService.getSavedUsers().length > 0;
                let initHash = location.hash || (toMain ? '#main' : toLogin ? '#login' : '#welcome');
                Router.to(initHash);
            }
        });
}
init();

function initServiceWorker() {
    if (!constants.IS_ENVIRONMENT_PROD) {
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
    }

    function installServiceWorker() {
        if (!navigator.serviceWorker) {
            log.warn('ServiceWorker not supported!');
            return;
        }
        navigator.serviceWorker.register('./serviceWorker.js').then((reg) => {
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
            navigator.serviceWorker.addEventListener('message', (evt) => {
                if (isUpdate && evt.data && evt.data.activated) {
                    MainVue.setTooltipI18n(i18nService.t('newVersionAvailableTheNextTimeYoullUseUpdated'), {
                        closeOnNavigate: false,
                        actionLink: i18nService.t('updateNow'),
                        actionLinkFn: () => {
                            window.location.reload();
                        },
                        msgType: 'info'
                    });
                }
            });
        });
    }
}

function checkAppVersion() {
    let version = localStorageService.getCurrentAppVersion();
    if (version && version !== constants.CURRENT_VERSION) {
        let showMsg = () => {
            let text = i18nService.t('youreNowUsingVersion', constants.CURRENT_VERSION);
            MainVue.setTooltip(text, {
                closeOnNavigate: true,
                timeout: 30000,
                actionLink: i18nService.t('moreInformation'),
                actionLinkUrl: 'https://github.com/asterics/AsTeRICS-Grid/releases/tag/' + constants.CURRENT_VERSION,
                msgType: 'info'
            });
            $(document).off(constants.EVENT_GRID_LOADED, showMsg);
        };
        $(document).on(constants.EVENT_GRID_LOADED, showMsg);
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

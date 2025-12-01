import $ from '../externals/jquery.js';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { i18nService } from '../service/i18nService';
import { constants } from '../util/constants';
import { util } from '../util/util';
import { inputEventHandler } from '../input/inputEventHandler';
import { dataService } from '../service/data/dataService';
import { databaseService } from '../service/data/databaseService';
import { localStorageService } from '../service/data/localStorageService';
import { helpService } from '../service/helpService';
import { Router } from '../router';
import NotificationBar from '../../vue-components/components/notificationBar.vue';
import ProgressBarModal from '../../vue-components/modals/progressBarModal.vue';
import SearchModal from "../../vue-components/modals/searchModal.vue";
import SuccessModal from "../../vue-components/modals/successModal.vue";
import { systemActionService } from '../service/systemActionService';

let MainVue = {};
let app = null;
let modalTypes = {
    MODAL_SEARCH: 'MODAL_SEARCH',
    MODAL_PROGRESSBAR: 'MODAL_PROGRESSBAR',
    MODAL_SUCCESS: 'MODAL_SUCCESS'
};

MainVue.setViewComponent = function (component, properties) {
    if (app && app.$refs.notificationBar.tooltipOptions.closeOnNavigate) {
        MainVue.clearTooltip();
    }
    app.setComponent(component, properties);
};

MainVue.isSidebarOpen = function () {
    return app.showSidebar;
};

MainVue.setTooltip = function (html, options) {
    if (!app) {
        return;
    }
    if (app.uiLocked) {
        app.hiddenPopupData = {
            html: html,
            options: options
        };
        return;
    }
    return app.$refs.notificationBar.setTooltip(html, options);
};

MainVue.setTooltipI18n = function (text, options) {
    MainVue.setTooltip(text, options);
};

MainVue.clearTooltip = function () {
    if (!app) {
        return;
    }
    app.hiddenPopupData = null;
    app.$refs.notificationBar.clearTooltip();
};

/**
 * Shows a progressbar with the given percentage/text. If a percentage of 100 is passed, the progressbar closes itself.
 * @param percentage
 * @param options.header
 * @param options.text
 * @param options.cancelFn (optional) a function that is called if the user closes the progressbar modal
 * @param options.closable if true, the user can close the modal
 */
MainVue.showProgressBar = function (percentage, options) {
    if (!app) {
        return;
    }
    app.showModal = modalTypes.MODAL_PROGRESSBAR;
    app.$refs.progressBar.setProgress(percentage, options);
};

/**
 * show search modal
 * @param options.searchText text to be pre-filled in search bar
 * @param options.searchCollectedText use text from collect element to be pre-filled in search bar, if true
 */
MainVue.showSearchModal = function (options) {
    app.showModal = modalTypes.MODAL_SEARCH;
    app.modalOptions = options || {};
};

/**
 * show success modal
 * @param options.header header text (default: "Success")
 * @param options.message message text
 * @param options.items array of items to show as list
 * @param options.autoCloseDuration duration in ms before auto-close (default: 2000)
 * @param options.type modal type: 'success', 'question', 'warning', 'info'
 * @param options.buttonPreset button preset: 'ok', 'yesno', 'okcancel'
 * @param options.buttons custom buttons array
 * @param options.showCloseButton show X close button (default: false)
 * @returns Promise that resolves with button value
 */
MainVue.showSuccessModal = function (options) {
    if (!app) {
        return Promise.resolve(false);
    }
    app.showModal = modalTypes.MODAL_SUCCESS;
    return new Promise((resolve) => {
        app.$nextTick(() => {
            if (app.$refs.successModal) {
                app.$refs.successModal.show(options || {}).then(resolve);
            } else {
                resolve(false);
            }
        });
    });
};

/**
 * show confirmation dialog (replaces native confirm())
 * @param message confirmation message
 * @param options.header header text (default: "Question")
 * @param options.buttonPreset button preset: 'yesno' (default), 'okcancel', 'ok'
 * @returns Promise that resolves to true if confirmed, false if cancelled
 */
MainVue.showConfirmDialog = function (message, options = {}) {
    return MainVue.showSuccessModal({
        type: 'question',
        header: options.header,
        message: message,
        buttonPreset: options.buttonPreset || 'yesno',
        showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true
    });
};

/**
 * show warning dialog
 * @param message warning message
 * @param options.header header text (default: "Warning")
 * @param options.buttonPreset button preset (default: 'ok')
 * @returns Promise that resolves with button value
 */
MainVue.showWarningDialog = function (message, options = {}) {
    return MainVue.showSuccessModal({
        type: 'warning',
        header: options.header,
        message: message,
        buttonPreset: options.buttonPreset || 'ok',
        showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true
    });
};

/**
 * show info dialog
 * @param message info message
 * @param options.header header text (default: "Information")
 * @param options.buttonPreset button preset (default: 'ok')
 * @returns Promise that resolves with button value
 */
MainVue.showInfoDialog = function (message, options = {}) {
    return MainVue.showSuccessModal({
        type: 'info',
        header: options.header,
        message: message,
        buttonPreset: options.buttonPreset || 'ok',
        showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true
    });
};

MainVue.searchModalOpened = function() {
    return app.showModal === modalTypes.MODAL_SEARCH;
};

MainVue.init = function () {
    Vue.use(VueI18n);
    return i18nService.getVueI18n().then((i18n) => {
        app = new Vue({
            i18n: i18n,
            el: '#app',
            components: { NotificationBar, ProgressBarModal, SearchModal, SuccessModal },
            data() {
                return {
                    component: null,
                    properties: null,
                    componentKey: 0,
                    showSidebar: false,
                    currentUser: databaseService.getCurrentUsedDatabase(),
                    isLocalUser: localStorageService.isSavedLocalUser(databaseService.getCurrentUsedDatabase()),
                    syncState: dataService.getSyncState(),
                    constants: constants,
                    tooltipHTML: null,
                    actionLink: null,
                    Router: Router,
                    uiLocked: false,
                    hiddenPopupData: null,
                    modalTypes: modalTypes,
                    showModal: null,
                    modalOptions: {}
                };
            },
            methods: {
                setComponent(component, properties) {
                    this.component = component;
                    this.properties = properties;
                    this.componentKey++; //forces to update the view, even with same component (e.g. grid view, other page)
                },
                closeSidebar() {
                    $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                },
                openSidebar() {
                    $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
                },
                openHelp() {
                    helpService.openHelp();
                },
                moreNavigation() {
                    $.contextMenu('destroy');
                    setupContextMenu();
                    $('#moreNavigation').contextMenu();
                },
                toMain() {
                    Router.toMain();
                }
            },
            mounted() {
                let thiz = this;
                $(document).on(constants.EVENT_SIDEBAR_OPEN, () => {
                    if (thiz.showSidebar) {
                        return;
                    }
                    if (!databaseService.getCurrentUsedDatabase()) {
                        thiz.showSidebar = true;
                        this.$nextTick(() => {
                            $(document).trigger(constants.EVENT_SIDEBAR_OPENED);
                            $(document).trigger(constants.EVENT_GRID_RESIZE);
                        });
                        return;
                    }
                    dataService.getMetadata().then((metadata) => {
                        if (!metadata.locked && !metadata.fullscreen) {
                            thiz.showSidebar = true;
                            this.$nextTick(() => {
                                $(document).trigger(constants.EVENT_SIDEBAR_OPENED);
                                $(document).trigger(constants.EVENT_GRID_RESIZE);
                            });
                        }
                    });
                });
                $(document).on(constants.EVENT_SIDEBAR_CLOSE, () => {
                    thiz.showSidebar = false;
                    this.$nextTick(() => {
                        $(document).trigger(constants.EVENT_GRID_RESIZE);
                    });
                });
                $(document).on(constants.EVENT_DB_INITIALIZED, () => {
                    thiz.currentUser = databaseService.getCurrentUsedDatabase();
                    thiz.isLocalUser = localStorageService.isSavedLocalUser(thiz.currentUser);
                });
                $(document).on(constants.EVENT_DB_CLOSED, () => {
                    thiz.currentUser = databaseService.getCurrentUsedDatabase();
                    thiz.isLocalUser = localStorageService.isSavedLocalUser(thiz.currentUser);
                });
                $(document).on(constants.EVENT_DB_SYNC_STATE_CHANGE, (event, syncState) => {
                    thiz.syncState = syncState;
                });
                $(document).on(constants.EVENT_GRID_IMAGES_CACHING, () => {
                    thiz.syncState = constants.DB_SYNC_STATE_SYNCINC;
                });
                $(document).on(constants.EVENT_GRID_IMAGES_CACHED, () => {
                    thiz.syncState = dataService.getSyncState();
                });
                $(document).on(constants.EVENT_UI_UNLOCKED, () => {
                    this.uiLocked = false;
                    if (this.hiddenPopupData) {
                        MainVue.setTooltip(this.hiddenPopupData.html, this.hiddenPopupData.options);
                        this.hiddenPopupData = null;
                    }
                });
                $(document).on(constants.EVENT_UI_LOCKED, () => {
                    this.uiLocked = true;
                    MainVue.clearTooltip();
                });
                thiz.syncState = dataService.getSyncState();
                window.addEventListener('resize', () => {
                    util.debounce(
                        function () {
                            $(document).trigger(constants.EVENT_GRID_RESIZE);
                        },
                        300,
                        constants.EVENT_GRID_RESIZE
                    );
                });
                inputEventHandler.global
                    .onSwipedDown(openSidebarIfFullscreen)
                    .onEscape(openSidebarIfFullscreen)
                    .onExitFullscreen(openSidebarIfFullscreen);
                inputEventHandler.global.startListening();
                thiz.openSidebar();

                async function openSidebarIfFullscreen() {
                    await systemActionService.exitFullscreen();
                    thiz.openSidebar();
                }
            }
        });
        return Promise.resolve();
    });
};

function setupContextMenu() {
    let CONTEXT_ADD_ONLINE = 'CONTEXT_ADD_ONLINE';
    let CONTEXT_ADD_OFFLINE = 'CONTEXT_ADD_OFFLINE';
    let CONTEXT_ABOUT = 'CONTEXT_ABOUT';
    let menuItems = {
        CONTEXT_ADD_ONLINE: { name: i18nService.t('addOnlineUser'), icon: 'fas fa-user-plus' },
        CONTEXT_ADD_OFFLINE: { name: i18nService.t('addOfflineUser'), icon: 'fas fa-user-plus' },
        CONTEXT_ABOUT: { name: i18nService.t('aboutAstericsGrid'), icon: 'fas fa-info-circle' }
    };
    $.contextMenu({
        selector: '#moreNavigation',
        callback: function (key, options) {
            handleContextMenu(key);
        },
        items: menuItems,
        trigger: 'left',
        zIndex: 10
    });

    function handleContextMenu(key) {
        switch (key) {
            case CONTEXT_ADD_ONLINE:
                Router.toRegister();
                break;
            case CONTEXT_ADD_OFFLINE:
                Router.toAddOffline();
                break;
            case CONTEXT_ABOUT:
                Router.toAbout();
                break;
        }
    }
}

export { MainVue };

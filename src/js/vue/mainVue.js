import $ from 'jquery';
import Vue from 'vue'
import {i18nService} from "../service/i18nService";
import {constants} from "../util/constants";
import {util} from "../util/util";
import {inputEventHandler} from "../input/inputEventHandler";
import {dataService} from "../service/data/dataService";
import {databaseService} from "../service/data/databaseService";
import {localStorageService} from "../service/data/localStorageService";
import {helpService} from "../service/helpService";
import {Router} from "../router";
import NotificationBar from "../../vue-components/components/notificationBar.vue"
import ProgressBarModal from "../../vue-components/modals/progressBarModal.vue"

let MainVue = {};
let app = null;


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
    return app.$refs.notificationBar.setTooltip(html, options);
};

MainVue.setTooltipI18n = function(translateText, options) {
    let translated = i18nService.translate(translateText);
    MainVue.setTooltip(translated, options);
};

MainVue.clearTooltip = function () {
    if (!app) {
        return;
    }
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
    app.showProgressBar = true;
    app.$refs.progressBar.setProgress(percentage, options);
}

MainVue.init = function () {
    app = new Vue({
        el: '#app',
        components: {NotificationBar, ProgressBarModal},
        data() {
            return {
                component: null,
                properties: null,
                componentKey: 0,
                showSidebar: false,
                currentUser: databaseService.getCurrentUsedDatabase(),
                isLocalUser: localStorageService.isSavedLocalUser(databaseService.getCurrentUsedDatabase()),
                syncState: dataService.getSyncState(),
                showProgressBar: false,
                constants: constants,
                tooltipHTML: null,
                actionLink: null
            }
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
            }
        },
        mounted() {
            let thiz = this;
            i18nService.initDomI18n();
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
                dataService.getMetadata().then(metadata => {
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
            thiz.syncState = dataService.getSyncState();
            window.addEventListener('resize', () => {
                util.debounce(function () {
                    $(document).trigger(constants.EVENT_GRID_RESIZE);
                }, 300, constants.EVENT_GRID_RESIZE);
            });
            inputEventHandler.global
                .onSwipedDown(openSidebarIfFullscreen)
                .onEscape(openSidebarIfFullscreen)
                .onExitFullscreen(openSidebarIfFullscreen);
            inputEventHandler.global.startListening();
            thiz.openSidebar();

            function openSidebarIfFullscreen() {
                if (thiz.showSidebar || !databaseService.getCurrentUsedDatabase()) {
                    return;
                }
                util.closeFullscreen();
                dataService.getMetadata().then(metadata => {
                    if (metadata.fullscreen) {
                        metadata.fullscreen = false;
                        dataService.saveMetadata(metadata).then(() => {
                            thiz.openSidebar();
                        });
                    }
                });
            }
        },
        updated() {
            i18nService.initDomI18n();
        }
    });
};

function setupContextMenu() {
    let CONTEXT_ADD_ONLINE = 'CONTEXT_ADD_ONLINE';
    let CONTEXT_ADD_OFFLINE = 'CONTEXT_ADD_OFFLINE';
    let CONTEXT_ABOUT = 'CONTEXT_ABOUT';
    let menuItems = {
        CONTEXT_ADD_ONLINE: {name: "Add online user // Online-User hinzufügen", icon: "fas fa-user-plus"},
        CONTEXT_ADD_OFFLINE: {name: "Add offline user // Offline-User hinzufügen", icon: "fas fa-user-plus"},
        CONTEXT_ABOUT: {name: "About AsTeRICS Grid // Über AsTeRICS Grid", icon: "fas fa-info-circle"},
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
    i18nService.initDomI18n();

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

export {MainVue}

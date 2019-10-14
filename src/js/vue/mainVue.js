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

let MainVue = {};
let app = null;
let _tooltipView = null;

MainVue.setViewComponent = function (component, properties) {
    if (_tooltipView !== Router.getCurrentView()) {
        MainVue.clearTooltip();
    }
    app.setComponent(component, properties);
};

MainVue.isSidebarOpen = function () {
    return app.showSidebar;
};

MainVue.setTooltip = function (html) {
    _tooltipView = Router.getCurrentView();
    app.tooltipHTML = html;
};

MainVue.clearTooltip = function () {
    app.tooltipHTML = null;
};

MainVue.init = function () {
    app = new Vue({
        el: '#app',
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
                tooltipHTML: null
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
                .onEscape(openSidebarIfFullscreen);
            inputEventHandler.global.startListening();
            thiz.openSidebar();

            function openSidebarIfFullscreen() {
                if (thiz.showSidebar || !databaseService.getCurrentUsedDatabase()) {
                    return;
                }
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

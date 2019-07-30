import $ from 'jquery';
import Navigo from 'navigo'

import {I18nModule} from './i18nModule.js';
import {dataService} from "./service/data/dataService.js";
import {helpService} from "./service/helpService";

import AllGridsView from '../vue-components/views/allGridsView.vue'
import GridEditView from '../vue-components/views/gridEditView.vue'
import GridView from '../vue-components/views/gridView.vue'
import LoginView from '../vue-components/views/loginView.vue'
import RegisterView from '../vue-components/views/registerView.vue'
import AddOfflineView from '../vue-components/views/addOfflineView.vue'
import WelcomeView from '../vue-components/views/welcomeView.vue'
import AboutView from '../vue-components/views/aboutView.vue'
import DictionariesView from '../vue-components/views/dictionariesView.vue'
import {databaseService} from "./service/data/databaseService";
import {localStorageService} from "./service/data/localStorageService";
import {MainVue} from "./vue/mainVue";

let NO_DB_VIEWS = ['#login', '#register', '#updating', '#welcome', '#add', '#about'];

let Router = {};
let navigoInstance = null;
let injectId = null;
let lastHash = null;
let routingEndabled = true;
let _initialized = false;
let _currentView = null;
let _currentVueApp = null;

Router.init = function (injectIdParam, initialHash) {
    if (!routingEndabled) {
        return;
    }
    _initialized = true;
    injectId = injectIdParam;
    navigoInstance = new Navigo(null, true);
    navigoInstance
        .on({
            'main': function () {
                helpService.setHelpLocation('02_navigation', '#main-view');
                toMainInternal();
            },
            'updating': function () {
                log.debug('loading updating view.');
                $('#updatingView').show();
                I18nModule.init();
                routingEndabled = false;
            },
            'grids/': function () {
                helpService.setHelpLocation('02_navigation', '#manage-grids-view');
                loadVueView(AllGridsView);
            },
            'grid/:gridId': function (params) {
                log.debug('route grid with ID: ' + params.gridId);
                helpService.setHelpLocation('02_navigation', '#main-view');
                loadVueView(GridView, {
                    gridId: params.gridId
                });
            },
            'grid/edit/:gridId': function (params) {
                log.debug('route edit grid with ID: ' + params.gridId);
                helpService.setHelpLocation('02_navigation', '#edit-view');
                loadVueView(GridEditView, {
                    gridId: params.gridId
                });
            },
            'login': function () {
                helpService.setHelpLocation('02_navigation', '#change-user-view');
                loadVueView(LoginView);
            },
            'register': function () {
                helpService.setHelpLocation('06_users', '#online-users');
                loadVueView(RegisterView);
            },
            'add': function () {
                helpService.setHelpLocation('06_users', '#offline-users');
                loadVueView(AddOfflineView);
            },
            'welcome': function () {
                helpService.setHelpLocation('00_index', '#asterics-grid-user-documentation');
                loadVueView(WelcomeView);
            },
            'about': function () {
                helpService.setHelpLocation('00_index', '#asterics-grid-user-documentation');
                loadVueView(AboutView);
            },
            'dictionaries': function () {
                helpService.setHelpLocation('02_navigation', '#manage-dictionaries-view');
                loadVueView(DictionariesView);
            },
            '*': function () {
                helpService.setHelpLocation('02_navigation', '#main-view');
                Router.toMain();
            }
        });
    navigoInstance.hooks({
        before: function (done, params) {
            if (_currentView && _currentView.destroy) {
                _currentView.destroy();
                _currentView = null;
            }
            if (_currentVueApp) {
                _currentVueApp.$destroy();
            }
            let validHash = getValidHash();
            if(location.hash !== validHash) {
                done(false);
                setHash(validHash);
            } else {
                done();
            }
        },
        after: function (params) {
            //log.debug('after');
        },
        leave: function (params) {
            //log.debug('leave');
        }
    });
    if (initialHash) {
        setHash(initialHash);
    }
    navigoInstance.resolve();
};

/**
 * returns false if Router.init() wasn't called before, otherwise true
 * @return {boolean}
 */
Router.isInitialized = function() {
    return _initialized;
};

Router.toMain = function () {
    setHash('#main');
};

Router.toUpdating = function () {
    setHash('#updating');
};

Router.toRegister = function () {
    setHash('#register');
};

Router.toLogin = function () {
    setHash('#login');
};

Router.toLastOpenedGrid = function () {
    dataService.getMetadata().then(metadata => {
       Router.toGrid(metadata.lastOpenedGridId);
    });
};

Router.toGrid = function (id) {
    if(id) {
        setHash('#grid/' + id + "?date=" + new Date().getTime());
    }
};

Router.toEditGrid = function (id) {
    if(id) {
        setHash('#grid/edit/' + id);
    }
};

Router.toManageGrids = function () {
    setHash('#grids');
};

Router.back = function () {
    if (lastHash && lastHash !== location.hash) {
        setHash(lastHash, true);
    } else {
        this.toMain();
    }
};

Router.isOnEditPage = function () {
    return window.location.hash.indexOf('#grid/edit') !== -1;
};

function getValidHash() {
    let hashToUse = location.hash;
    if (!databaseService.getCurrentUsedDatabase()) {
        let lastActiveUser = localStorageService.getLastActiveUser();
        hashToUse = NO_DB_VIEWS.includes(hashToUse) ? hashToUse : null;
        hashToUse = hashToUse || (lastActiveUser ? '#login' : '#welcome');
    }
    return hashToUse;
}

function getHash() {
    let hash = location.hash;
    let index = hash.lastIndexOf('/');
    index = index > -1 ? index : hash.length;
    return hash.substring(0, index);
}

function setHash(hash, reset) {
    lastHash = reset ? null : location.hash;
    location.hash = hash;
}

function loadVueView(viewObject, properties) {
    if (!routingEndabled) {
        return;
    }
    let hash = getHash();
    $('nav button').removeClass('selected');
    $(`nav a[href='${hash}'] button`).addClass('selected');
    log.debug('loading view: ' + viewObject.__file);
    MainVue.setViewComponent(viewObject, properties);
}

function toMainInternal() {
    if (!routingEndabled) {
        return;
    }
    log.debug('main view');
    dataService.getMetadata().then(metadata => {
        let gridId = metadata ? metadata.lastOpenedGridId : null;
        loadVueView(GridView, {
            gridId: gridId
        });
    });
}

export {Router};
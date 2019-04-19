import $ from 'jquery';
import Navigo from 'navigo'
import Vue from 'vue'

import {I18nModule} from './i18nModule.js';
import {GridView} from "./views/gridView.js";
import {GridEditView} from "./views/gridEditView.js";
import {dataService} from "./service/data/dataService.js";

import AllGridsView from '../vue-components/views/allGridsView.vue'
import LoginView from '../vue-components/views/loginView.vue'
import RegisterView from '../vue-components/views/registerView.vue'
import AddOfflineView from '../vue-components/views/addOfflineView.vue'
import WelcomeView from '../vue-components/views/welcomeView.vue'
import {databaseService} from "./service/data/databaseService";
import {localStorageService} from "./service/data/localStorageService";

let NO_DB_VIEWS = ['#login', '#register', '#updating', '#welcome', '#add'];

let Router = {};
let navigoInstance = null;
let viewsFolder = 'views/';
let filePostfix = '.html';
let injectId = null;
let lastHash = null;
let routingEndabled = true;
let _initialized = false;
let _currentView = null;

Router.init = function (injectIdParam, initialHash) {
    _initialized = true;
    injectId = injectIdParam;
    navigoInstance = new Navigo(null, true);
    navigoInstance
        .on({
            'main': function () {
                toMainInternal();
            },
            'updating': function () {
                loadView('updatingView');
                routingEndabled = false;
            },
            'grids/': function () {
                loadVueView(AllGridsView);
            },
            'grid/:gridId': function (params) {
                log.debug('route grid with ID: ' + params.gridId);
                loadView('gridView').then(() => {
                    _currentView = new GridView().init(params.gridId);
                });
            },
            'grid/edit/:gridId': function (params) {
                log.debug('route edit grid with ID: ' + params.gridId);
                loadView('gridEditView').then(() => {
                    _currentView = new GridEditView().init(params.gridId);
                });
            },
            'login': function () {
                loadVueView(LoginView);
            },
            'register': function () {
                loadVueView(RegisterView);
            },
            'add': function () {
                loadVueView(AddOfflineView);
            },
            'welcome': function () {
                loadVueView(WelcomeView);
            },
            '*': function () {
                Router.toMain();
            }
        });
    navigoInstance.hooks({
        before: function (done, params) {
            if (_currentView && _currentView.destroy) {
                _currentView.destroy();
                _currentView = null;
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
    if(lastHash) {
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

function setHash(hash, reset) {
    lastHash = reset ? null : location.hash;
    location.hash = hash;
}

function loadView(viewName) {
    log.debug('loading view: ' + viewName);
    return new Promise((resolve, reject) => {
        if(!routingEndabled) {
            reject();
            return;
        }
        $(injectId).load(viewsFolder + viewName + filePostfix, null, function () {
            I18nModule.init();
            log.debug('loaded view: ' + viewName);
            resolve();
        });
    })
}

function loadVueView(viewObject) {
    log.debug('loading view: ' + viewObject.__file);
    var viewName = viewObject.__file;
    var startIndex = viewName.lastIndexOf('/') !== -1 ? viewName.lastIndexOf('/') + 1 : 0;
    viewName = viewName.substring(startIndex, viewName.lastIndexOf('.'));
    var viewNameDash = viewName.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`); //camelCase to dash-case
    var injectHtml = `<div id="app"><${viewNameDash}/></div>`;
    var components = {};
    components[viewName] = viewObject;
    $(injectId).html(injectHtml);
    var app = new Vue({
        el: '#app',
        data: {},
        components: components
    });
}

function toMainInternal() {
    log.debug('main view');
    dataService.getMetadata().then(metadata => {
        let gridId = metadata ? metadata.lastOpenedGridId : null;
        loadView('gridView').then(() => {
            if(gridId) {
                _currentView = new GridView().init(gridId);
            } else {
                dataService.getGridsAttribute('id').then(idsMap => {
                    let ids = Object.keys(idsMap);
                    if(ids[0]) {
                        _currentView = new GridView().init(ids[0]);
                    } else {
                        Router.toManageGrids();
                    }
                });
            }
        });
    });
}

export {Router};
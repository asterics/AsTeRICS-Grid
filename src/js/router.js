import $ from './externals/jquery.js';
import Navigo from 'navigo';

import { i18nService } from './service/i18nService';
import { dataService } from './service/data/dataService.js';
import { helpService } from './service/helpService';

import AllGridsView from '../vue-components/views/allGridsView.vue';
import GridEditView from '../vue-components/views/gridEditView.vue';
import GridView from '../vue-components/views/gridView.vue';
import LoginView from '../vue-components/views/loginView.vue';
import RegisterView from '../vue-components/views/registerView.vue';
import AddOfflineView from '../vue-components/views/addOfflineView.vue';
import WelcomeView from '../vue-components/views/welcomeView.vue';
import AboutView from '../vue-components/views/aboutView.vue';
import DictionariesView from '../vue-components/views/dictionariesView.vue';
import SettingsView from '../vue-components/views/settingsView.vue';
import { databaseService } from './service/data/databaseService';
import { localStorageService } from './service/data/localStorageService';
import { MainVue } from './vue/mainVue';
import HelpView from '../vue-components/views/helpView.vue';
import { constants } from './util/constants.js';
import { urlParamService } from './service/urlParamService';

let NO_DB_VIEWS = ['#login', '#register', '#welcome', '#add', '#about', '#help', '#outdated'];

let Router = {};
let navigoInstance = null;
let injectId = null;
let lastHash = null;
let routingEndabled = true;
let _initialized = false;
let _currentView = null;
let _currentVueApp = null;
let _gridHistory = [];
let _locked = false;

Router.VIEWS = {
    AllGridsView: AllGridsView,
    GridView: GridView,
    GridEditView: GridEditView
}

Router.init = function (injectIdParam, initialHash) {
    if (!routingEndabled) {
        return;
    }
    _initialized = true;
    injectId = injectIdParam;
    navigoInstance = new Navigo(null, true);
    navigoInstance.on({
        main: function () {
            helpService.setHelpLocation('02_navigation', '#main-view');
            toMainInternal();
        },
        'grids/': function () {
            helpService.setHelpLocation('02_navigation', '#manage-grids-view');
            loadVueView(AllGridsView);
        },
        'grid/:gridId': function (params, query) {
            log.debug('route grid with ID: ' + params.gridId);
            let passParams = urlParamService.getSearchQueryParams(params);
            helpService.setHelpLocation('02_navigation', '#main-view');
            loadVueView(GridView, passParams, '#main');
        },
        'grid/name/:gridName': function (params) {
            log.debug('route grid with Name: ' + params.gridName);
            helpService.setHelpLocation('02_navigation', '#main-view');
            dataService.getGrids().then((result) => {
                let gridsWithName = result.filter((grid) => i18nService.getTranslation(grid.label) === params.gridName);
                let id = gridsWithName[0] ? gridsWithName[0].id : null;
                if (id) {
                    loadVueView(
                        GridView,
                        {
                            gridId: id
                        },
                        '#main'
                    );
                } else {
                    log.warn(`no grid with name ${params.gridName} found!`);
                    toMainInternal();
                }
            });
        },
        'grid/edit/:gridId': function (params) {
            helpService.setHelpLocation('02_navigation', '#edit-view');
            loadVueView(GridEditView, params);
        },
        'grid/edit/:gridId/:highlightId': function (params) {
            helpService.setHelpLocation('02_navigation', '#edit-view');
            loadVueView(GridEditView, params);
        },
        login: function () {
            helpService.setHelpLocation('02_navigation', '#change-user-view');
            loadVueView(LoginView);
        },
        register: function () {
            helpService.setHelpLocation('06_users', '#online-users');
            loadVueView(RegisterView);
        },
        add: function () {
            helpService.setHelpLocation('06_users', '#offline-users');
            loadVueView(AddOfflineView);
        },
        welcome: function () {
            helpService.setHelpLocationIndex();
            loadVueView(WelcomeView);
        },
        about: function () {
            helpService.setHelpLocationIndex();
            loadVueView(AboutView);
        },
        dictionaries: function () {
            helpService.setHelpLocation('02_navigation', '#manage-dictionaries-view');
            loadVueView(DictionariesView);
        },
        settings: function () {
            //TODO add correct help location
            loadVueView(SettingsView);
        },
        help: function () {
            loadVueView(HelpView);
        },
        '*': function () {
            helpService.setHelpLocation('02_navigation', '#main-view');
            Router.toMain();
        }
    });
    navigoInstance.hooks({
        before: function (done, params) {
            let hash = location.hash;
            $(document).trigger(constants.EVENT_NAVIGATE);
            let validForLocked =
                !hash.startsWith('#grid/edit') && (hash.startsWith('#main') || hash.startsWith('#grid/'));
            if (_locked && !validForLocked) {
                done(constants.IS_SAFARI ? undefined : false);
                if (constants.IS_SAFARI) {
                    return setTimeout(() => {
                        Router.toMain();
                    }, 100);
                }
                return Router.toMain();
            }
            if (_currentView && _currentView.destroy) {
                _currentView.destroy();
                _currentView = null;
            }
            if (_currentVueApp) {
                _currentVueApp.$destroy();
            }
            let validHash = getValidHash();
            if (location.hash !== validHash) {
                done(false);
                Router.to(validHash);
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
        Router.to(initialHash);
    }
    navigoInstance.resolve();
};

/**
 * returns false if Router.init() wasn't called before, otherwise true
 * @return {boolean}
 */
Router.isInitialized = function () {
    return _initialized;
};

/**
 * navigate to the given hash
 * @param hash the hash to navigate to, e.g. '#main'
 * @param options.reset if true, the last hash isn't stored for "back" navigation purposes
 * @param options.noHistory if true, the last hash isn't stored for "back" navigation purposes
 */
Router.to = function (hash, options) {
    options = options || {};
    lastHash = options.reset ? null : location.hash;
    let url = getFullUrl(hash);
    if (options.noHistory) {
        location.replace(url);
    } else {
        location.assign(url);
    }
};

Router.toMain = function () {
    Router.to('#main' + '?date=' + new Date().getTime());
};

Router.toRegister = function () {
    Router.to('#register');
};

Router.toAddOffline = function () {
    Router.to('#add');
};

Router.toAbout = function () {
    Router.to('#about');
};

Router.toLogin = function () {
    Router.to('#login');
};

Router.toLastOpenedGrid = function () {
    dataService.getMetadata().then((metadata) => {
        Router.toGrid(metadata.lastOpenedGridId);
    });
};

Router.toGrid = function (id, props) {
    if (id) {
        Router.addToGridHistory(id);
        props = props || {};
        urlParamService.setParamsToSearchQuery(props);
        let hash = `#grid/${id}`;

        if (_currentView === GridView) {
            dataService.getGrid(id).then((gridData) => {
                if (!gridData) {
                    return;
                }
                if (history && history.replaceState) {
                    history.replaceState(null, null, getFullUrl(`#grid/${id}`));
                }
                $(document).trigger(constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE, [gridData, props]);
            });
        } else {
            let noHistory = location.hash.startsWith('#main');
            Router.to(hash, { noHistory: noHistory });
        }
    }
};

Router.toEditGrid = function (id, highlightId) {
    if (id) {
        Router.to(`#grid/edit/${id}/${highlightId ? highlightId : ''}`);
    }
};

Router.toManageGrids = function () {
    Router.to('#grids');
};

Router.back = function () {
    if (lastHash && lastHash !== location.hash) {
        Router.to(lastHash, { reset: true });
    } else {
        this.toMain();
    }
};

Router.isOnEditPage = function () {
    return window.location.hash.indexOf('#grid/edit') !== -1;
};

Router.getCurrentView = function () {
    return _currentView;
};

Router.addToGridHistory = function (gridId) {
    if (_gridHistory.length > 0 && _gridHistory[_gridHistory.length - 1] === gridId) {
        return;
    }
    if (_gridHistory.indexOf(gridId) !== -1) {
        _gridHistory = [gridId];
        return;
    }
    _gridHistory.push(gridId);
};

Router.toLastGrid = function () {
    if (_gridHistory.length === 1) {
        return;
    }
    _gridHistory.pop(); // remove current grid
    let toId = _gridHistory.pop();
    Router.toGrid(toId);
};

function getValidHash() {
    let hashToUse = location.hash;
    if (!databaseService.getCurrentUsedDatabase()) {
        let toLogin = localStorageService.getLastActiveUser() || localStorageService.getSavedUsers().length > 0;
        hashToUse = NO_DB_VIEWS.includes(hashToUse) ? hashToUse : null;
        hashToUse = hashToUse || (toLogin ? '#login' : '#welcome');
    }
    return hashToUse;
}

function getHash() {
    let hash = location.hash;
    let index = hash.lastIndexOf('/');
    index = index > -1 ? index : hash.length;
    return hash.substring(0, index);
}

function getFullUrl(hash) {
    return location.origin + location.pathname + location.search + hash;
}

function loadVueView(viewObject, properties, menuItemToHighlight) {
    if (!routingEndabled) {
        return;
    }

    _currentView = viewObject;
    if (viewObject !== GridView) {
        $('#touchElement').hide();
    }

    setMenuItemSelected(menuItemToHighlight || getHash());
    log.debug('loading view: ' + viewObject.__file);
    MainVue.setViewComponent(viewObject, properties);
}

function setMenuItemSelected(hash) {
    $('nav button').removeClass('selected');
    $(`nav a[href='${hash}'] button`).addClass('selected');
}

function toMainInternal() {
    if (!routingEndabled) {
        return;
    }
    dataService.getMetadata().then((metadata) => {
        let gridId = metadata ? metadata.homeGridId || metadata.lastOpenedGridId : null;
        if (gridId) {
            return Router.toGrid(gridId);
        }
        loadVueView(GridView);
    });
}

$(document).on(constants.EVENT_UI_LOCKED, () => {
    _locked = true;
});

$(document).on(constants.EVENT_UI_UNLOCKED, () => {
    _locked = false;
});

export { Router };

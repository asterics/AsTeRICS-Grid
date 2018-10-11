import $ from 'jquery';
import Navigo from 'navigo'

import {I18nModule} from './i18nModule.js';
import {GridView} from "./views/gridView.js";
import {GridEditView} from "./views/gridEditView.js";
import {AllGridsView} from "./views/allGridsView.js";
import {dataService} from "./service/dataService.js";

var Router = {};
var navigoInstance = null;
var viewsFolder = 'views/';
var filePostfix = '.html';
var injectId = null;
var lastHash = null;

Router.init = function (injectIdParam) {
    injectId = injectIdParam;
    navigoInstance = new Navigo(null, true);
    navigoInstance
        .on({
            'main': function () {
                toMainInternal();
            },
            'grids/': function () {
                loadView('allGridsView').then(() => {
                    AllGridsView.init();
                });
            },
            'grid/:gridId': function (params) {
                log.debug('route grid with ID: ' + params.gridId);
                loadView('gridView').then(() => {
                    GridView.init(params.gridId);
                });
            },
            'grid/edit/:gridId': function (params) {
                log.debug('route edit grid with ID: ' + params.gridId);
                loadView('gridEditView').then(() => {
                    GridEditView.init(params.gridId);
                });
            },
            '*': function () {
                Router.toMain();
            }
        })
        .resolve();
    navigoInstance.hooks({
        before: function (done, params) {
            GridView.destroy();
            GridEditView.destroy();
            done();
        },
        after: function (params) {
            //log.debug('after');
        },
        leave: function (params) {
            //log.debug('leave');
        }
    });
};

Router.toMain = function () {
    setHash('#main');
};

Router.toGrid = function (id) {
    setHash('#grid/' + id);
};

Router.toEditGrid = function (id) {
    setHash('#grid/edit/' + id);
};

Router.toManageGrids = function () {
    setHash('#grids');
};

Router.back = function () {
    if(lastHash) {
        setHash(lastHash);
    } else {
        this.toMain();
    }
};

function setHash(hash) {
    lastHash = location.hash;
    location.hash = hash;
}

function loadView(viewName) {
    log.info('loading view: ' + viewName);
    return new Promise(resolve => {
        $(injectId).load(viewsFolder + viewName + filePostfix, null, function () {
            I18nModule.init();
            log.debug('loaded view: ' + viewName);
            resolve();
        });
    })
}

function toMainInternal() {
    window.log.debug('main view');
    dataService.getMetadata().then(metadata => {
        var gridId = metadata ? metadata.lastOpenedGridId : null;
        loadView('gridView').then(() => {
            GridView.init(gridId);
        });
    });
}

export {Router};
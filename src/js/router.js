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
                console.log('route grid with ID: ' + params.gridId);
                loadView('gridView').then(() => {
                    GridView.init(params.gridId);
                });
            },
            'grid/edit/:gridId': function (params) {
                console.log('route edit grid with ID: ' + params.gridId);
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
            //console.log('after');
        },
        leave: function (params) {
            //console.log('leave');
        }
    });
};

Router.toMain = function () {
    location.hash = '#main';
};

Router.toGrid = function (id) {
    location.hash = '#grid/' + id;
};

Router.toEditGrid = function (id) {
    location.hash = '#grid/edit/' + id;
};

function loadView(viewName) {
    console.log('loading view: ' + viewName);
    return new Promise(resolve => {
        $(injectId).load(viewsFolder + viewName + filePostfix, null, function () {
            I18nModule.init();
            console.log('loaded view: ' + viewName);
            resolve();
        });
    })
}

function toMainInternal() {
    console.log('main view');
    dataService.getMetadata().then(metadata => {
        var gridId = metadata ? metadata.lastOpenedGridId : null;
        loadView('gridView').then(() => {
            GridView.init(gridId);
        });
    });
}

export {Router};
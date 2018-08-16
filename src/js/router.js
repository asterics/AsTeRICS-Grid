import $ from 'jquery';
import Navigo from 'navigo'
import domI18n from '../../node_modules/dom-i18n/dist/dom-i18n.min';
import {GridView} from "./views/gridView.js";

var Router = {};
var navigoInstance = null;
var injectId = null;

Router.init = function(injectIdParam) {
    injectId = injectIdParam;
    navigoInstance = new Navigo(null, true);
    navigoInstance
        .on({
            'main': function () {
                toMain();
            },
            'grids/': function () {
                loadView('views/allGridsView.html');
            },
            'grid/:gridId': function (params) {
                console.log('route grid with ID: ' + params.gridId);
            },
            '*': function () {
                toMain();
            }
        })
        .resolve();
    navigoInstance.hooks({
        before: function (done, params) {
            console.log('before');
            GridView.destroy();
            done();
        },
        after: function (params) {
            console.log('after');
        },
        leave: function (params) {
            console.log('leave');
        }
    });
};

function initI18n() {
    domI18n({
        selector: '[data-i18n]',
        separator: ' // ',
        languages: ['en', 'de']
    });
}

function loadView(viewName) {
    console.log('loading view: ' + viewName);
    return new Promise(resolve => {
        $(injectId).load(viewName, null, function () {
            initI18n();
            console.log('loaded view: ' + viewName);
            resolve();
        });
    })
}

function toMain() {
    loadView('views/gridView.html').then(() => {
        GridView.init();
    });
}

export {Router};
import $ from 'jquery';
import domI18n from '../../node_modules/dom-i18n/dist/dom-i18n.min';
import Navigo from 'navigo'
import {GridView} from "./views/gridView.js";

function init() {
    domI18n({
        selector: '[data-i18n]',
        separator: ' // ',
        languages: ['en', 'de']
    });

    initRoutes();
};
init();

function initRoutes() {
    var router = new Navigo(null, true);
    router
        .on({
            'main': function () {
                toMain();
            },
            'grids/': function () {
                console.log('route grids');
                $('#main').load('views/allGridsView.html', null, function () {
                    console.log('loaded all grids');
                });
            },
            'grid/:gridId': function (params) {
                console.log('route grid with ID: ' + params.gridId);
            },
            '*': function () {
                toMain();
            }
        })
        .resolve();
    router.hooks({
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
}

function toMain() {
    console.log('route main');
    $('#main').load('views/gridView.html', null, function () {
        GridView.init();
    });
}
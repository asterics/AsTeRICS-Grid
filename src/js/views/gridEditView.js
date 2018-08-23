import Vue from 'vue'
import $ from 'jquery';
import {Grid} from "../grid.js";
import {dataService} from "../service/dataService";
import {Router} from "./../router.js";

import EditGridModal from '../../vue-components/editGridModal.vue'

var GridEditView = {};
var contextMenuSelector = '.grid-item-content';
var CONTEXT_EDIT = "CONTEXT_EDIT";
var CONTEXT_DUPLICATE = "CONTEXT_DUPLICATE";
var CONTEXT_DELETE = "CONTEXT_DELETE";

GridEditView.init = function (gridId) {
    dataService.getGrid(gridId).then(grid => {
        if (!grid) {
            console.log('grid not found! gridId: ' + gridId);
            Router.toMain();
            return;
        }
        GridEditView.gridData = grid;
        initVue();
    });
};

GridEditView.destroy = function () {
    GridEditView.grid = null;
    $.contextMenu('destroy');
};

function initVue() {
    var app = new Vue({
        el: '#app',
        data: {
            gridData: JSON.parse(JSON.stringify(GridEditView.gridData)),
            canUndo: false,
            canRedo: false,
            showModal: false
        },
        components: {
            EditGridModal
        },
        methods: {
            changeRowCount: function (event) {
                GridEditView.grid.setNumberOfRows(event.target.value);
            },
            fillGaps: function () {
                GridEditView.grid.fillGaps();
            },
            compactLayout: function () {
                GridEditView.grid.compactLayout();
            },
            undo: function () {
                GridEditView.grid.undo();
            },
            redo: function () {
                GridEditView.grid.redo();
            },
        },
        mounted: function () {
            var thiz = this;
            initGrid().then(() => {
                GridEditView.grid.autosize();
                GridEditView.grid.setLayoutChangedEndListener((newGridData) => {
                    thiz.canUndo = GridEditView.grid.canUndo();
                    thiz.canRedo = GridEditView.grid.canRedo();
                    thiz.gridData.rowCount = newGridData.rowCount;
                });
                initContextmenu();
            });
        },
        updated: () => {
            GridEditView.grid.autosize();
        }
    })
}

function initGrid() {
    GridEditView.grid = new Grid('#grid-container', '.grid-item-content', {
        enableResizing: true,
        dragAndDrop: true,
        gridId: GridEditView.gridData.id
    });
    return GridEditView.grid.getInitPromise();
}

function initContextmenu() {
    var items = {};
    items[CONTEXT_EDIT] = {name: "Edit", icon: "fas fa-edit"};
    items[CONTEXT_DUPLICATE] = {name: "Duplicate", icon: "far fa-clone"};
    items[CONTEXT_DELETE] = {name: "Delete", icon: "far fa-trash-alt"};

    $.contextMenu({
        selector: contextMenuSelector,
        callback: function (key, options) {
            var elementId = $(this).attr('id');
            switch (key) {
                case CONTEXT_EDIT: {
                    console.log('edit!');
                    break;
                }
                case CONTEXT_DUPLICATE: {
                    console.log('CONTEXT_DUPLICATE!');
                    break;
                }
                case CONTEXT_DELETE: {
                    console.log('deleting element: ' + elementId);
                    GridEditView.grid.removeElement(elementId).then(newGridData => {
                        GridEditView.gridData = newGridData;
                    });
                    break;
                }
            }
        },
        items: items
    });
}

export {GridEditView};
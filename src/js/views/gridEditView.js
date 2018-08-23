import Vue from 'vue'
import $ from 'jquery';
import {Grid} from "../grid.js";
import {dataService} from "../service/dataService";

var GridEditView = {};
var CONTEXT_EDIT = "CONTEXT_EDIT";
var CONTEXT_DUPLICATE = "CONTEXT_DUPLICATE";
var CONTEXT_DELETE = "CONTEXT_DELETE";

GridEditView.init = function (gridId) {
    dataService.getGrid(gridId).then(grid => {
        if (!grid) {
            console.log('grid not found! gridId: ' + gridId);
            return;
        }
        GridEditView.gridData = grid;
        initVue();
    });
};

GridEditView.destroy = function () {
    GridEditView.grid = null;
};

function initVue() {
    var app = new Vue({
        el: '#app',
        data: {
            gridData: JSON.parse(JSON.stringify(GridEditView.gridData)),
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
            }
        },
        mounted: () => {
            initGrid().then(() => {
                GridEditView.grid.autosize();
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
        selector: '.grid-item-content',
        callback: function(key, options) {
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
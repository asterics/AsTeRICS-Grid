import Vue from 'vue'
import $ from 'jquery';
import {Grid} from "../grid.js";
import {dataService} from "../service/dataService";
import {Router} from "./../router.js";
import {I18nModule} from "./../i18nModule.js";

import EditGridModal from '../../vue-components/editGridModal.vue'

var GridEditView = {};
var vueApp = null;

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
    vueApp = new Vue({
        el: '#app',
        data: {
            gridData: JSON.parse(JSON.stringify(GridEditView.gridData)),
            canUndo: false,
            canRedo: false,
            doingUndoRedo: false,
            showModal: false,
            editElementId: null
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
                this.doingUndoRedo = true;
                setTimeout(function () {
                    GridEditView.grid.undo();
                }, 10);
            },
            redo: function () {
                this.doingUndoRedo = true;
                setTimeout(function () {
                    GridEditView.grid.redo();
                }, 10);
            },
            reload (gridElement) {
                console.log('doing reload: ' + gridElement.label);
                var thiz = this;
                GridEditView.grid.reinit();
                dataService.getGrid(thiz.gridData.id).then(data => {
                    thiz.gridData = data;
                })
            },
            editElement(elementId) {
                this.editElementId = elementId;
                this.showModal = true;
            },
            newElement() {
                this.editElementId = null;
                this.showModal = true;
            },
        },
        mounted: function () {
            var thiz = this;
            initGrid().then(() => {
                GridEditView.grid.autosize();
                GridEditView.grid.setLayoutChangedEndListener((newGridData) => {
                    thiz.canUndo = GridEditView.grid.canUndo();
                    thiz.canRedo = GridEditView.grid.canRedo();
                    thiz.doingUndoRedo = false;
                    dataService.getGrid(thiz.gridData.id).then(data => {
                        thiz.gridData = data;
                    });

                });
                initContextmenu();
                I18nModule.init();
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
    //see https://swisnl.github.io/jQuery-contextMenu/demo.html

    var contextMenuSelector = '.grid-item-content';

    var CONTEXT_EDIT = "CONTEXT_EDIT";
    var CONTEXT_DUPLICATE = "CONTEXT_DUPLICATE";
    var CONTEXT_DELETE = "CONTEXT_DELETE";

    var CONTEXT_NEW_GROUP = "CONTEXT_NEW_GROUP";
    var CONTEXT_NEW_SINGLE = "CONTEXT_NEW_SINGLE";
    var CONTEXT_NEW_MASS = "CONTEXT_NEW_MASS";

    var itemsGlobal = {
        CONTEXT_NEW_GROUP: {
            name: "New // Neu", icon: "fas fa-plus-circle", items: {
                'CONTEXT_NEW_SINGLE': {name: "New Element // Neues Element", icon: "fas fa-plus"},
                'CONTEXT_NEW_MASS': {name: "Many new elements // Mehrere neue Elemente", icon: "fas fa-clone"}
            }
        }
    };

    var itemsElem = {
        CONTEXT_EDIT: {name: "Edit // Bearbeiten", icon: "fas fa-edit"},
        CONTEXT_DUPLICATE: {name: "Duplicate // Klonen", icon: "far fa-clone"},
        CONTEXT_DELETE: {name: "Delete // Löschen", icon: "far fa-trash-alt"},
        SEP1: "---------",
        CONTEXT_NEW_GROUP: itemsGlobal[CONTEXT_NEW_GROUP]
    };

    $.contextMenu({
        selector: contextMenuSelector,
        callback: function (key, options) {
            var elementId = $(this).attr('id');
            handleContextMenu(key, elementId);
        },
        items: itemsElem
    });

    $.contextMenu({
        selector: '.grid-container',
        callback: function (key, options) {
            handleContextMenu(key);
        },
        items: itemsGlobal
    });

    function handleContextMenu(key, elementId) {
        switch (key) {
            case CONTEXT_EDIT: {
                vueApp.editElement(elementId);
                break;
            }
            case CONTEXT_DUPLICATE: {
                GridEditView.grid.duplicateElement(elementId);
                break;
            }
            case CONTEXT_DELETE: {
                GridEditView.grid.removeElement(elementId).then(newGridData => {
                    GridEditView.gridData = newGridData;
                });
                break;
            }
            case CONTEXT_NEW_SINGLE: {
                vueApp.newElement();
                break;
            }
            case CONTEXT_NEW_MASS: {
                console.log('new mass');
                break;
            }
        }
    }
}

export {GridEditView};
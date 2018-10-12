import Vue from 'vue'
import $ from 'jquery';
import {Grid} from "../grid.js";
import {dataService} from "../service/dataService";
import {Router} from "./../router.js";
import {I18nModule} from "./../i18nModule.js";
import {MetaData} from "./../model/MetaData";

import EditGridModal from '../../vue-components/editGridModal.vue'
import AddMultipleModal from '../../vue-components/addMultipleModal.vue'
import EditActionsModal from '../../vue-components/editActionsModal.vue'

var GridEditView = {};
var vueApp = null;

GridEditView.init = function (gridId) {
    dataService.getGrid(gridId).then(grid => {
        if (!grid) {
            log.warn('grid not found! gridId: ' + gridId);
            Router.toMain();
            return;
        }
        GridEditView.gridData = grid;
        dataService.getMetadata().then(savedMetadata => {
            dataService.saveMetadata(new MetaData({
                lastOpenedGridId: GridEditView.gridData.id
            }, savedMetadata));
        });
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
            showEditModal: false,
            showMultipleModal: false,
            showActionsModal: false,
            editElementId: null
        },
        components: {
            EditGridModal, AddMultipleModal, EditActionsModal
        },
        methods: {
            addRow: function (event) {
                GridEditView.grid.setNumberOfRows(this.gridData.rowCount + 1);
            },
            removeRow: function (event) {
                if (this.gridData.rowCount > 1) {
                    GridEditView.grid.setNumberOfRows(this.gridData.rowCount - 1);
                }
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
            reload () {
                var thiz = this;
                GridEditView.grid.reinit();
                dataService.getGrid(thiz.gridData.id).then(data => {
                    thiz.gridData = JSON.parse(JSON.stringify(data));
                })
            },
            back() {
                Router.back();
            },
            editElement(elementId) {
                this.editElementId = elementId;
                this.showEditModal = true;
            },
            newElement() {
                this.editElementId = null;
                this.showEditModal = true;
            },
            editActions(elementId) {
                this.editElementId = elementId;
                this.showActionsModal = true;
            },
            newElements() {
                this.showMultipleModal = true;
            },
            clearElements() {
                if(confirm('Do you really want to delete all elements of the current grid?')) {
                    this.gridData.gridElements = [];
                    GridEditView.grid.updateGridWithUndo(this.gridData);
                }
            },
        },
        mounted: function () {
            var thiz = this;
            initGrid().then(() => {
                GridEditView.grid.setLayoutChangedEndListener((newGridData) => {
                    thiz.canUndo = GridEditView.grid.canUndo();
                    thiz.canRedo = GridEditView.grid.canRedo();
                    thiz.doingUndoRedo = false;
                    dataService.getGrid(thiz.gridData.id).then(data => {
                        thiz.gridData = JSON.parse(JSON.stringify(data));
                    });

                });
                initContextmenu();
                I18nModule.init();
            });
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
    var CONTEXT_ACTIONS = "CONTEXT_ACTIONS";
    var CONTEXT_DELETE = "CONTEXT_DELETE";
    var CONTEXT_DELETE_ALL = "CONTEXT_DELETE_ALL";

    var CONTEXT_NEW_GROUP = "CONTEXT_NEW_GROUP";
    var CONTEXT_NEW_SINGLE = "CONTEXT_NEW_SINGLE";
    var CONTEXT_NEW_MASS = "CONTEXT_NEW_MASS";

    var CONTEXT_LAYOUT_COMPACT = "CONTEXT_LAYOUT_COMPACT";
    var CONTEXT_LAYOUT_FILL = "CONTEXT_LAYOUT_FILL";
    var CONTEXT_LAYOUT_MOREROWS = "CONTEXT_LAYOUT_MOREROWS";
    var CONTEXT_LAYOUT_LESSROWS = "CONTEXT_LAYOUT_LESSROWS";

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
        CONTEXT_ACTIONS: {name: "Actions // Aktionen", icon: "fas fa-bolt"},
        CONTEXT_DELETE: {name: "Delete // Löschen", icon: "far fa-trash-alt"},
        SEP1: "---------",
        CONTEXT_NEW_GROUP: itemsGlobal[CONTEXT_NEW_GROUP]
    };

    var itemsMoreMenu = {
        'CONTEXT_NEW_SINGLE': itemsGlobal[CONTEXT_NEW_GROUP].items[CONTEXT_NEW_SINGLE],
        'CONTEXT_NEW_MASS': itemsGlobal[CONTEXT_NEW_GROUP].items[CONTEXT_NEW_MASS],
        'CONTEXT_DELETE_ALL': {name: "Delete all elements // Alle Elemente löschen", icon: "fas fa-minus-circle"},
        SEP1: "---------",
        'CONTEXT_LAYOUT_MOREROWS': {name: "Add row // Zeile hinzufügen", icon: "far fa-plus-square"},
        'CONTEXT_LAYOUT_LESSROWS': {name: "Remove row // Zeile entfernen", icon: "far fa-minus-square"},
        'CONTEXT_LAYOUT_COMPACT': {name: "Automatic layout // Automatisches Layout", icon: "fas fa-th"},
        'CONTEXT_LAYOUT_FILL': {name: "Fill gaps // Lücken füllen", icon: "fas fa-angle-double-left"}
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

    $.contextMenu({
        selector: '#moreButton',
        callback: function (key, options) {
            handleContextMenu(key);
        },
        trigger: 'left',
        items: itemsMoreMenu
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
            case CONTEXT_ACTIONS: {
                vueApp.editActions(elementId);
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
                vueApp.newElements();
                break;
            }
            case CONTEXT_DELETE_ALL: {
                vueApp.clearElements();
                break;
            }
            case CONTEXT_LAYOUT_COMPACT: {
                vueApp.compactLayout();
                break;
            }
            case CONTEXT_LAYOUT_FILL: {
                vueApp.fillGaps();
                break;
            }
            case CONTEXT_LAYOUT_MOREROWS: {
                vueApp.addRow();
                break;
            }
            case CONTEXT_LAYOUT_LESSROWS: {
                vueApp.removeRow();
                break;
            }
        }
    }
}

export {GridEditView};
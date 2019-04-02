import Vue from 'vue'
import $ from 'jquery';
import {Grid} from "../grid.js";
import {dataService} from "../service/data/dataService";
import {Router} from "./../router.js";
import {I18nModule} from "./../i18nModule.js";
import {MetaData} from "./../model/MetaData";
import {translateService} from "../service/translateService";

import EditGridModal from '../../vue-components/editGridModal.vue'
import AddMultipleModal from '../../vue-components/addMultipleModal.vue'
import EditActionsModal from '../../vue-components/editActionsModal.vue'
import {actionService} from "../service/actionService";
import {GridElement} from "../model/GridElement";
import {GridData} from "../model/GridData";
import {constants} from "../util/constants";
import {localStorageService} from "../service/data/localStorageService";

var GridEditView = {};
var vueApp = null;

GridEditView.init = function (gridId) {
    $(document).on(constants.EVENT_DB_PULL_UPDATED, reloadFn);
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
    $(document).off(constants.EVENT_DB_PULL_UPDATED, reloadFn);
};

function reloadFn() {
    if (vueApp) {
        vueApp.reload();
    }
}

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
            editElementId: null,
            showGrid: false,
            isSyncing: false,
            isLocalUser: localStorageService.isLastActiveUserLocal()
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
            newElement(type) {
                switch(type) {
                    case GridElement.ELEMENT_TYPE_COLLECT: {
                        var newPos = new GridData(this.gridData).getNewXYPos();
                        var newElement = new GridElement({
                            type: GridElement.ELEMENT_TYPE_COLLECT,
                            x: newPos.x,
                            y: newPos.y
                        });
                        dataService.updateOrAddGridElement(GridEditView.gridData.id, newElement).then(() => {
                            this.reload();
                        });
                        break;
                    }
                    default: {
                        this.editElementId = null;
                        this.showEditModal = true;
                    }
                }
            },
            editActions(elementId) {
                this.editElementId = elementId;
                this.showActionsModal = true;
            },
            newElements() {
                this.showMultipleModal = true;
            },
            clearElements() {
                if(confirm(translateService.translate('CONFIRM_DELETE_ALL_ELEMS'))) {
                    this.gridData.gridElements = [];
                    GridEditView.grid.updateGridWithUndo(this.gridData);
                }
            },
        },
        mounted: function () {
            let thiz = this;
            if (!thiz.isLocalUser) {
                $(document).on(constants.EVENT_DB_SYNC_STATE_CHANGE, (event, synced) => {
                    thiz.isSyncing = synced;
                });
                thiz.isSyncing = dataService.isDatabaseSyncing();
            }
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
                thiz.showGrid = true;
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
    var CONTEXT_DO_ACTION = "CONTEXT_DO_ACTION";
    var CONTEXT_ACTIONS = "CONTEXT_ACTIONS";
    var CONTEXT_DELETE = "CONTEXT_DELETE";
    var CONTEXT_DELETE_ALL = "CONTEXT_DELETE_ALL";

    var CONTEXT_NEW_GROUP = "CONTEXT_NEW_GROUP";
    var CONTEXT_NEW_SINGLE = "CONTEXT_NEW_SINGLE";
    var CONTEXT_NEW_MASS = "CONTEXT_NEW_MASS";
    var CONTEXT_NEW_COLLECT = "CONTEXT_NEW_COLLECT";
    var CONTEXT_NEW_PREDICT = "CONTEXT_NEW_PREDICT";

    var CONTEXT_LAYOUT_COMPACT = "CONTEXT_LAYOUT_COMPACT";
    var CONTEXT_LAYOUT_FILL = "CONTEXT_LAYOUT_FILL";
    var CONTEXT_LAYOUT_MOREROWS = "CONTEXT_LAYOUT_MOREROWS";
    var CONTEXT_LAYOUT_LESSROWS = "CONTEXT_LAYOUT_LESSROWS";

    var itemsGlobal = {
        CONTEXT_NEW_GROUP: {
            name: "New // Neu", icon: "fas fa-plus-circle", items: {
                'CONTEXT_NEW_SINGLE': {name: "New Element // Neues Element", icon: "fas fa-plus"},
                'CONTEXT_NEW_MASS': {name: "Many new elements // Mehrere neue Elemente", icon: "fas fa-clone"},
                'CONTEXT_NEW_COLLECT': {name: "New collect element // Neues Sammel-Element", icon: "far fa-comment-dots"},
                'CONTEXT_NEW_PREDICT': {name: "New prediction element // Neues Vorhersage-Element", icon: "fas fa-magic"}
            }
        }
    };

    var itemsMoreMenuItem = {
        CONTEXT_DUPLICATE: {name: "Duplicate // Klonen", icon: "far fa-clone"},
        CONTEXT_DO_ACTION: {name: "Do element action // Aktion des Elements ausführen", icon: "fas fa-bolt"},
    };

    var itemsElem = {
        CONTEXT_EDIT: {name: "Edit // Bearbeiten", icon: "fas fa-edit"},
        CONTEXT_ACTIONS: {name: "Actions // Aktionen", icon: "fas fa-bolt"},
        CONTEXT_DELETE: {name: "Delete // Löschen", icon: "far fa-trash-alt"},
        CONTEXT_MORE_GROUP: {
            name: "More // Mehr", icon: "fas fa-bars", items: itemsMoreMenuItem
        }
    };

    var itemsMoreMenuButton = {
        CONTEXT_NEW_GROUP: itemsGlobal[CONTEXT_NEW_GROUP],
        'CONTEXT_DELETE_ALL': {name: "Delete all elements // Alle Elemente löschen", icon: "fas fa-minus-circle"},
        SEP1: "---------",
        'CONTEXT_LAYOUT_MOREROWS': {name: "Add row to layout // Zeile in Layout hinzufügen", icon: "far fa-plus-square"},
        'CONTEXT_LAYOUT_LESSROWS': {name: "Remove row from layout // Zeile in Layout entfernen", icon: "far fa-minus-square"},
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
        items: itemsMoreMenuButton
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
            case CONTEXT_DO_ACTION: {
                actionService.doAction(GridEditView.gridData.id, elementId);
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
            case CONTEXT_NEW_COLLECT: {
                vueApp.newElement(GridElement.ELEMENT_TYPE_COLLECT);
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
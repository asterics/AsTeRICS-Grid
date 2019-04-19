import Vue from 'vue'
import $ from 'jquery';
import {Grid} from "../grid.js";
import {dataService} from "../service/data/dataService";
import {Router} from "./../router.js";
import {I18nModule} from "./../i18nModule.js";
import {MetaData} from "./../model/MetaData";
import {translateService} from "../service/translateService";

import EditGridModal from '../../vue-components/modals/editGridModal.vue'
import AddMultipleModal from '../../vue-components/modals/addMultipleModal.vue'
import EditActionsModal from '../../vue-components/modals/editActionsModal.vue'
import {actionService} from "../service/actionService";
import {GridElement} from "../model/GridElement";
import {GridData} from "../model/GridData";
import {constants} from "../util/constants";
import {localStorageService} from "../service/data/localStorageService";

/**
 * class GridEditView, controller for view "gridEditView"
 * @constructor
 */
function GridEditView() {

    let GridEditViewInstance = this;
    let vueApp = null;

    /**
     * initializes the view
     * @param gridId the ID of the grid to show
     * @return {GridEditView}
     */
    GridEditViewInstance.init = function (gridId) {
        $(document).on(constants.EVENT_DB_PULL_UPDATED, reloadFn);
        dataService.getGrid(gridId).then(gridData => {
            if (!gridData) {
                log.warn('grid not found! gridId: ' + gridId);
                Router.toMain();
                return;
            }
            dataService.getMetadata().then(savedMetadata => {
                dataService.saveMetadata(new MetaData({
                    lastOpenedGridId: gridData.id
                }, savedMetadata));
            });
            initVue(gridData);
        });
        return GridEditViewInstance;
    };

    /**
     * destroys the view
     */
    GridEditViewInstance.destroy = function () {
        if (GridEditViewInstance.grid) {
            GridEditViewInstance.grid.setLayoutChangedEndListener(null);
            GridEditViewInstance.grid.setLayoutChangedStartListener(null);
            GridEditViewInstance.grid = null;
        }
        $.contextMenu('destroy');
        $(document).off(constants.EVENT_DB_PULL_UPDATED, reloadFn);
    };

    function reloadFn(event, updatedIds, updatedDocs) {
        if (vueApp && updatedIds.includes(vueApp.gridData.id) && GridEditViewInstance.grid && GridEditViewInstance.grid.isInitialized()) {
            let gridData = new GridData(updatedDocs.filter(doc => doc.id === vueApp.gridData.id)[0]);
            if (!gridData.isEqual(vueApp.gridData)) {
                log.debug('reloading on remote update...');
                vueApp.reload(gridData);
            }
        }
    }

    function initVue(gridData) {
        vueApp = new Vue({
            el: '#app',
            data: {
                gridData: JSON.parse(JSON.stringify(gridData)),
                canUndo: false,
                canRedo: false,
                doingUndoRedo: false,
                showEditModal: false,
                showMultipleModal: false,
                showActionsModal: false,
                editElementId: null,
                showGrid: false,
                syncState: null,
                isLocalUser: localStorageService.isLastActiveUserLocal(),
                constants: constants
            },
            components: {
                EditGridModal, AddMultipleModal, EditActionsModal
            },
            methods: {
                addRow: function (event) {
                    GridEditViewInstance.grid.setNumberOfRows(this.gridData.rowCount + 1);
                },
                removeRow: function (event) {
                    if (this.gridData.rowCount > 1) {
                        GridEditViewInstance.grid.setNumberOfRows(this.gridData.rowCount - 1);
                    }
                },
                fillGaps: function () {
                    GridEditViewInstance.grid.fillGaps();
                },
                compactLayout: function () {
                    GridEditViewInstance.grid.compactLayout();
                },
                undo: function () {
                    this.doingUndoRedo = true;
                    setTimeout(function () {
                        GridEditViewInstance.grid.undo();
                    }, 10);
                },
                redo: function () {
                    this.doingUndoRedo = true;
                    setTimeout(function () {
                        GridEditViewInstance.grid.redo();
                    }, 10);
                },
                reload(gridData) {
                    GridEditViewInstance.grid.reinit(gridData);
                    if (gridData) {
                        this.gridData = JSON.parse(JSON.stringify(gridData));
                    }
                },
                back() {
                    Router.back();
                },
                editElement(elementId) {
                    this.editElementId = elementId;
                    this.showEditModal = true;
                },
                newElement(type) {
                    switch (type) {
                        case GridElement.ELEMENT_TYPE_COLLECT: {
                            var newPos = new GridData(this.gridData).getNewXYPos();
                            var newElement = new GridElement({
                                type: GridElement.ELEMENT_TYPE_COLLECT,
                                x: newPos.x,
                                y: newPos.y
                            });
                            dataService.updateOrAddGridElement(this.gridData.id, newElement).then(() => {
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
                    if (confirm(translateService.translate('CONFIRM_DELETE_ALL_ELEMS'))) {
                        this.gridData.gridElements = [];
                        GridEditViewInstance.grid.updateGridWithUndo(this.gridData);
                    }
                },
            },
            mounted: function () {
                let thiz = this;
                if (!thiz.isLocalUser) {
                    $(document).on(constants.EVENT_DB_SYNC_STATE_CHANGE, (event, syncState) => {
                        thiz.syncState = syncState;
                    });
                    thiz.syncState = dataService.getSyncState();
                }
                initGrid(gridData).then(() => {
                    GridEditViewInstance.grid.setLayoutChangedEndListener((newGridData) => {
                        thiz.canUndo = GridEditViewInstance.grid.canUndo();
                        thiz.canRedo = GridEditViewInstance.grid.canRedo();
                        thiz.doingUndoRedo = false;
                        thiz.gridData = JSON.parse(JSON.stringify(newGridData));
                    });
                    initContextmenu();
                    I18nModule.init();
                    thiz.showGrid = true;
                });
            }
        })
    }

    function initGrid(gridData) {
        GridEditViewInstance.grid = new Grid('#grid-container', '.grid-item-content', {
            enableResizing: true,
            dragAndDrop: true,
            gridId: gridData.id
        });
        return GridEditViewInstance.grid.getInitPromise();
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
                    'CONTEXT_NEW_COLLECT': {
                        name: "New collect element // Neues Sammel-Element",
                        icon: "far fa-comment-dots"
                    },
                    'CONTEXT_NEW_PREDICT': {
                        name: "New prediction element // Neues Vorhersage-Element",
                        icon: "fas fa-magic"
                    }
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
            'CONTEXT_LAYOUT_MOREROWS': {
                name: "Add row to layout // Zeile in Layout hinzufügen",
                icon: "far fa-plus-square"
            },
            'CONTEXT_LAYOUT_LESSROWS': {
                name: "Remove row from layout // Zeile in Layout entfernen",
                icon: "far fa-minus-square"
            },
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
                    GridEditViewInstance.grid.duplicateElement(elementId);
                    break;
                }
                case CONTEXT_DO_ACTION: {
                    actionService.doAction(vueApp.gridData.id, elementId);
                    break;
                }
                case CONTEXT_ACTIONS: {
                    vueApp.editActions(elementId);
                    break;
                }
                case CONTEXT_DELETE: {
                    GridEditViewInstance.grid.removeElement(elementId).then(newGridData => {
                        vueApp.gridData = newGridData;
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
}

export {GridEditView};
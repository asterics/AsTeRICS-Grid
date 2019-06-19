<template>
    <div v-cloak v-if="gridData" class="box">
        <header class="row header" role="banner">
            <header-icon class="left"></header-icon>
            <button @click="back" title="Back" class="spaced left small"><i class="fas fa-angle-left"></i> <span class="hide-mobile" data-i18n>Back // Zurück</span></button>
            <button id="moreButton" title="More" class="spaced"><i class="fas fa-bars"></i> <span class="hide-mobile" data-i18n>More // Mehr</span></button>
            <div class="spaced btn-group">
                <button @click="undo" title="Undo" :disabled="!canUndo || doingUndoRedo" class="small"><i class="fas fa-undo"></i> <span class="hide-mobile" data-i18n>Undo // Rückgängig</span></button>
                <button @click="redo" title="Redo" :disabled="!canRedo || doingUndoRedo" class="small spaced"><i class="fas fa-redo"></i> <span class="hide-mobile" data-i18n>Redo // Wiederherstellen</span></button>
            </div>
        </header>
        <div class="row content spaced" v-if="!gridData.gridElements || gridData.gridElements.length == 0" role="main">
            <div style="margin-top: 2em">
                <span data-i18n>No elements. // Keine Elemente.</span> <a href="javascript:void(0);" @click="newElements()" data-i18n="">Create new elements // Neue Elemente anlegen</a>
                <div data-i18n="">Elements also can be created using a right mouse click. // Elemente können auch über einen rechten Mausklick hinzugefügt werden.</div>
            </div>
        </div>
        <div>
            <edit-grid-modal v-if="showEditModal" v-bind:edit-element-id-param="editElementId" v-bind:grid-data="gridData" @close="showEditModal = false" @reload="reload"/>
        </div>
        <div>
            <add-multiple-modal v-if="showMultipleModal" v-bind:grid-data="gridData" @close="showMultipleModal = false" @reload="reload"/>
        </div>
        <div>
            <edit-actions-modal v-if="showActionsModal" v-bind:edit-element-id-param="editElementId" v-bind:grid-data="gridData" @close="showActionsModal = false" @reload="reload"/>
        </div>
        <div class="row content">
            <div v-if="!showGrid" class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin"/>
            </div>
            <div id="grid-container" class="grid-container">
            </div>
            <div id="grid-layout-background-wrapper" class="grid-container" v-if="gridData.gridElements && gridData.gridElements.length > 0" style="margin: 10px;">
                <div id="grid-layout-background-vertical" class="grid-container" style="margin-left: 204px; background-size: 209px 209px;
    background-image: linear-gradient(to right, grey 1px, transparent 1px)">
                </div>
                <div id="grid-layout-background-horizontal" class="grid-container" style="margin-top: 204px; background-size: 209px 209px;
    background-image: linear-gradient(to bottom, grey 1px, transparent 1px);">
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from 'jquery';
    import {Grid} from "../../js/grid.js";
    import {dataService} from "../../js/service/data/dataService";
    import {Router} from "./../../js/router.js";
    import {I18nModule} from "./../../js/i18nModule.js";
    import {MetaData} from "./../../js/model/MetaData";
    import {translateService} from "../../js/service/translateService";

    import EditGridModal from '../modals/editGridModal.vue'
    import AddMultipleModal from '../modals/addMultipleModal.vue'
    import EditActionsModal from '../modals/editActionsModal.vue'
    import {actionService} from "../../js/service/actionService";
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {constants} from "../../js/util/constants";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {inputEventHandler} from "../../js/util/inputEventHandler";

    let vueApp = null;
    let gridInstance = null;

    let vueConfig = {
        props: ['gridId'],
        data() {
            return {
                gridData: null,
                canUndo: false,
                canRedo: false,
                doingUndoRedo: false,
                showEditModal: false,
                showMultipleModal: false,
                showActionsModal: false,
                editElementId: null,
                showGrid: false,
                constants: constants
            }
        },
        components: {
            EditGridModal, AddMultipleModal, EditActionsModal, HeaderIcon
        },
        methods: {
            addRow: function (event) {
                gridInstance.setNumberOfRows(this.gridData.rowCount + 1);
            },
            removeRow: function (event) {
                if (this.gridData.rowCount > 1) {
                    gridInstance.setNumberOfRows(this.gridData.rowCount - 1);
                }
            },
            fillGaps: function () {
                gridInstance.fillGaps();
            },
            undo: function () {
                this.doingUndoRedo = true;
                setTimeout(function () {
                    gridInstance.undo();
                }, 10);
            },
            redo: function () {
                this.doingUndoRedo = true;
                setTimeout(function () {
                    gridInstance.redo();
                }, 10);
            },
            reload(gridData) {
                gridInstance.reinit(gridData);
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
                    case GridElement.ELEMENT_TYPE_PREDICTION:
                    case GridElement.ELEMENT_TYPE_COLLECT: {
                        var newPos = new GridData(this.gridData).getNewXYPos();
                        var newElement = new GridElement({
                            type: type,
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
                    gridInstance.updateGridWithUndo(this.gridData);
                }
            },
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            $(document).on(constants.EVENT_DB_PULL_UPDATED, reloadFn);
            inputEventHandler.stopListening();
            dataService.getGrid(this.gridId).then(gridData => {
                if (!gridData) {
                    log.warn('grid not found! gridId: ' + this.gridId);
                    Router.toMain();
                    return Promise.reject();
                }
                thiz.gridData = JSON.parse(JSON.stringify(gridData));
                return Promise.resolve();
            }).then(() => {
                dataService.getMetadata().then(savedMetadata => {
                    dataService.saveMetadata(new MetaData({
                        lastOpenedGridId: thiz.gridData.id
                    }, savedMetadata));
                });
                return initGrid(thiz.gridData);
            }).then(() => {
                gridInstance.setLayoutChangedEndListener((newGridData) => {
                    thiz.canUndo = gridInstance.canUndo();
                    thiz.canRedo = gridInstance.canRedo();
                    thiz.doingUndoRedo = false;
                    thiz.gridData = JSON.parse(JSON.stringify(newGridData));
                });
                initContextmenu();
                I18nModule.init();
                thiz.showGrid = true;
            });
        },
        updated() {
            I18nModule.init();
        },
        beforeDestroy() {
            inputEventHandler.startListening();
            if (gridInstance) {
                gridInstance.destroy();
                gridInstance = null;
            }
            $.contextMenu('destroy');
            $(document).off(constants.EVENT_DB_PULL_UPDATED, reloadFn);
        }
    };

    function reloadFn(event, updatedIds, updatedDocs) {
        if (vueApp && updatedIds.includes(vueApp.gridData.id) && gridInstance && gridInstance.isInitialized()) {
            let gridData = new GridData(updatedDocs.filter(doc => doc.id === vueApp.gridData.id)[0]);
            if (!gridData.isEqual(vueApp.gridData)) {
                log.debug('reloading on remote update...');
                vueApp.reload(gridData);
            }
        }
    }

    function initGrid(gridData) {
        gridInstance = new Grid('#grid-container', '.grid-item-content', {
            enableResizing: true,
            dragAndDrop: true,
            gridId: gridData.id
        });
        return gridInstance.getInitPromise();
    }

    function initContextmenu() {
        //see https://swisnl.github.io/jQuery-contextMenu/demo.html

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

        var itemsElemNormal = {
            CONTEXT_EDIT: {name: "Edit // Bearbeiten", icon: "fas fa-edit"},
            CONTEXT_ACTIONS: {name: "Actions // Aktionen", icon: "fas fa-bolt"},
            CONTEXT_DELETE: {name: "Delete // Löschen", icon: "far fa-trash-alt"},
            CONTEXT_MORE_GROUP: {
                name: "More // Mehr", icon: "fas fa-bars", items: itemsMoreMenuItem
            }
        };

        let itemsElemSpecial = JSON.parse(JSON.stringify(itemsElemNormal));
        delete itemsElemSpecial[CONTEXT_EDIT];

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
            'CONTEXT_LAYOUT_FILL': {name: "Fill gaps // Lücken füllen", icon: "fas fa-angle-double-left"}
        };

        $.contextMenu({
            selector: '.item[data-type="ELEMENT_TYPE_NORMAL"]',
            callback: function (key, options) {
                var elementId = $(this).attr('data-id');
                handleContextMenu(key, elementId);
            },
            items: itemsElemNormal
        });

        $.contextMenu({
            selector: '.item[data-type!="ELEMENT_TYPE_NORMAL"]',
            callback: function (key, options) {
                var elementId = $(this).attr('data-id');
                handleContextMenu(key, elementId);
            },
            items: itemsElemSpecial
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
                    gridInstance.duplicateElement(elementId);
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
                    gridInstance.removeElement(elementId).then(newGridData => {
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
                case CONTEXT_NEW_PREDICT: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_PREDICTION);
                    break;
                }
                case CONTEXT_DELETE_ALL: {
                    vueApp.clearElements();
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

    export default vueConfig;
</script>

<style scoped>
</style>
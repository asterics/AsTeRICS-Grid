<template>
    <div v-cloak v-if="gridData" class="box">
        <header class="row header" role="banner">
            <header-icon class="left"></header-icon>
            <button tabindex="30" @click="back" title="Back" class="spaced small left">
                <i class="fas fa-eye"></i>
                <span class="hide-mobile" data-i18n>Editing off // Bearbeiten aus</span>
            </button>
            <button tabindex="33" id="moreButton" title="More" class="spaced"><i class="fas fa-ellipsis-v"></i> <span class="hide-mobile" data-i18n>More // Mehr</span></button>
            <div class="spaced btn-group">
                <button tabindex="31" @click="undo" title="Undo" :disabled="!canUndo || doingUndoRedo" class="small"><i class="fas fa-undo"></i> <span class="hide-mobile" data-i18n>Undo // Rückgängig</span></button>
                <button tabindex="32" @click="redo" title="Redo" :disabled="!canRedo || doingUndoRedo" class="small spaced"><i class="fas fa-redo"></i> <span class="hide-mobile" data-i18n>Redo // Wiederherstellen</span></button>
            </div>
        </header>
        <div>
            <edit-grid-modal v-if="showEditModal" v-bind:edit-element-id-param="editElementId" :grid-instance="getGridInstance()" :grid-data-id="gridData.id" @close="showEditModal = false" @mark="markElement" @actions="(id) => {editElementId = id; showActionsModal = true}"/>
        </div>
        <div>
            <add-multiple-modal v-if="showMultipleModal" v-bind:grid-data="gridData" :grid-instance="getGridInstance()" @close="showMultipleModal = false"/>
        </div>
        <div>
            <edit-actions-modal v-if="showActionsModal" v-bind:edit-element-id-param="editElementId" v-bind:grid-id-param="gridData.id" @close="showActionsModal = false" @reload="reload" @edit="showEditModal = true"/>
        </div>
        <div>
            <grid-dimension-modal v-if="showDimensionsModal" v-bind:grid-data-param="gridData" :is-global-grid="metadata.globalGridId === gridData.id" @close="showDimensionsModal = false" @save="setDimensions"/>
        </div>
        <div>
            <element-move-modal v-if="showMoveModal" :grid-id="gridData.id" :grid-element-id="editElementId" @close="showMoveModal = false" @reload="reload"/>
        </div>
        <div>
            <grid-translate-modal v-if="showTranslateModal" :grid-data-id="gridData.id" @close="showTranslateModal = false" @reload="reload"/>
        </div>
        <div class="row content">
            <div v-if="!showGrid" class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin"/>
            </div>
            <div id="grid-container" class="grid-container">
            </div>
            <div id="grid-layout-background-wrapper" class="grid-container" style="margin: 10px; display: none">
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
    import {i18nService} from "../../js/service/i18nService";

    import EditGridModal from '../modals/editGridModal.vue'
    import AddMultipleModal from '../modals/addMultipleModal.vue'
    import EditActionsModal from '../modals/editActionsModal.vue'
    import {actionService} from "../../js/service/actionService";
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {constants} from "../../js/util/constants";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {inputEventHandler} from "../../js/input/inputEventHandler";
    import {util} from "../../js/util/util";
    import GridDimensionModal from "../modals/gridDimensionModal.vue";
    import {gridUtil} from "../../js/util/gridUtil";
    import ElementMoveModal from "../modals/elementMoveModal.vue";
    import GridTranslateModal from "../modals/gridTranslateModal.vue";
    import {GridActionYoutube} from "../../js/model/GridActionYoutube";
    import {printService} from "../../js/service/printService";

    let vueApp = null;
    let gridInstance = null;

    let vueConfig = {
        props: ['gridId'],
        data() {
            return {
                gridData: null,
                metadata: null,
                canUndo: false,
                canRedo: false,
                doingUndoRedo: false,
                showEditModal: false,
                showMultipleModal: false,
                showActionsModal: false,
                showDimensionsModal: false,
                showMoveModal: false,
                showTranslateModal: false,
                editElementId: null,
                showGrid: false,
                constants: constants,
                markedElement: null
            }
        },
        components: {
            GridTranslateModal,
            ElementMoveModal,
            GridDimensionModal, EditGridModal, AddMultipleModal, EditActionsModal, HeaderIcon
        },
        methods: {
            setDimensions: function (rows, cols) {
                gridInstance.setDimensions(rows, cols);
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
                Router.toMain();
            },
            editElement(elementId) {
                this.editElementId = elementId;
                this.showEditModal = true;
            },
            removeElement(id) {
                let thiz = this;
                gridInstance.removeElement(id).then(newGridData => {
                    thiz.gridData = newGridData;
                });
            },
            newElement(type) {
                switch (type) {
                    case GridElement.ELEMENT_TYPE_PREDICTION:
                    case GridElement.ELEMENT_TYPE_COLLECT:
                    case GridElement.ELEMENT_TYPE_YT_PLAYER: {
                        var newPos = new GridData(this.gridData).getNewXYPos();
                        var newElement = new GridElement({
                            type: type,
                            x: newPos.x,
                            y: newPos.y
                        });
                        if (type === GridElement.ELEMENT_TYPE_YT_PLAYER) {
                            let playPause = new GridActionYoutube({
                                action: GridActionYoutube.actions.YT_TOGGLE
                            });
                            newElement.actions = [playPause];
                        }
                        this.gridData.gridElements.push(newElement);
                        gridInstance.updateGridWithUndo(this.gridData);
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
                if (confirm(i18nService.translate('CONFIRM_DELETE_ALL_ELEMS'))) {
                    this.gridData.gridElements = [];
                    gridInstance.updateGridWithUndo(this.gridData);
                }
            },
            fillElements() {
                let elements = gridUtil.getFillElements(this.gridData);
                this.gridData.gridElements = this.gridData.gridElements.concat(elements);
                gridInstance.updateGridWithUndo(this.gridData);
            },
            reloadFn(event, updatedIds, updatedDocs) {
                if (vueApp && updatedIds.includes(vueApp.gridData.id) && gridInstance && gridInstance.isInitialized()) {
                    let gridData = new GridData(updatedDocs.filter(doc => doc.id === vueApp.gridData.id)[0]);
                    if (!gridData.isEqual(vueApp.gridData)) {
                        log.debug('reloading on remote update...');
                        vueApp.reload(gridData);
                    }
                }
            },
            markElement(id) {
                $('.grid-item-content').removeClass('marked');
                if (!id) {
                    return;
                }
                setTimeout(() => {
                    util.throttle(() => {
                        if (!this.markedElement || this.markedElement.id !== id) {
                            this.markedElement = !id ? null : this.gridData.gridElements.filter(el => el.id === id)[0];
                            $('#' + id).addClass('marked');
                        } else {
                            this.markedElement = null;
                        }
                    }, null, 200);
                }, 10);
            },
            getGridInstance() {
                return gridInstance;
            }
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            inputEventHandler.global.stopListening();
            dataService.getGrid(this.gridId).then(gridData => {
                if (!gridData) {
                    log.warn('grid not found! gridId: ' + this.gridId);
                    Router.toMain();
                    return Promise.reject();
                }
                thiz.gridData = JSON.parse(JSON.stringify(gridData));
                return Promise.resolve();
            }).then(() => {
                return dataService.getMetadata().then(savedMetadata => {
                    thiz.metadata = JSON.parse(JSON.stringify(savedMetadata));
                    if (thiz.metadata.globalGridId === thiz.gridData.id) {
                        return Promise.resolve();
                    }
                    thiz.metadata.lastOpenedGridId = thiz.gridData.id;
                    return dataService.saveMetadata(thiz.metadata);
                });
            }).then(() => {
                return initGrid(thiz.gridData);
            }).then(() => {
                gridInstance.setLayoutChangedEndListener((newGridData) => {
                    thiz.canUndo = gridInstance.canUndo();
                    thiz.canRedo = gridInstance.canRedo();
                    thiz.doingUndoRedo = false;
                    thiz.gridData = JSON.parse(JSON.stringify(newGridData));
                });
                initContextmenu();
                i18nService.initDomI18n();
                thiz.showGrid = true;
            });
        },
        updated() {
            i18nService.initDomI18n();
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            vueApp = null;
            inputEventHandler.global.startListening();
            if (gridInstance) {
                gridInstance.destroy();
                gridInstance = null;
                printService.setGridInstance(null);
            }
            $.contextMenu('destroy');
        }
    };

    function initGrid(gridData) {
        gridInstance = new Grid('#grid-container', '.grid-item-content', {
            enableResizing: true,
            dragAndDrop: true,
            gridId: gridData.id
        });
        printService.setGridInstance(gridInstance);
        return gridInstance.getInitPromise();
    }

    function initContextmenu() {
        //see https://swisnl.github.io/jQuery-contextMenu/demo.html

        var CONTEXT_EDIT = "CONTEXT_EDIT";
        var CONTEXT_DUPLICATE = "CONTEXT_DUPLICATE";
        var CONTEXT_DO_ACTION = "CONTEXT_DO_ACTION";
        var CONTEXT_ACTIONS = "CONTEXT_ACTIONS";
        var CONTEXT_DELETE = "CONTEXT_DELETE";
        var CONTEXT_FILL_EMPTY = "CONTEXT_FILL_EMPTY";
        var CONTEXT_DELETE_ALL = "CONTEXT_DELETE_ALL";

        let CONTEXT_ACTION_EDIT = 'CONTEXT_ACTION_EDIT';
        let CONTEXT_ACTION_DELETE = 'CONTEXT_ACTION_DELETE';
        let CONTEXT_ACTION_DUPLICATE = 'CONTEXT_ACTION_DUPLICATE';
        let CONTEXT_ACTION_EDIT_ACTIONS = 'CONTEXT_ACTION_EDIT_ACTIONS';
        let CONTEXT_ACTION_DO_ACTION = 'CONTEXT_ACTION_DO_ACTION';
        let CONTEXT_MOVE_TO = 'CONTEXT_MOVE_TO';

        var CONTEXT_NEW_GROUP = "CONTEXT_NEW_GROUP";
        var CONTEXT_NEW_SINGLE = "CONTEXT_NEW_SINGLE";
        var CONTEXT_NEW_MASS = "CONTEXT_NEW_MASS";
        var CONTEXT_NEW_COLLECT = "CONTEXT_NEW_COLLECT";
        var CONTEXT_NEW_PREDICT = "CONTEXT_NEW_PREDICT";
        var CONTEXT_NEW_YT_PLAYER = "CONTEXT_NEW_YT_PLAYER";

        var CONTEXT_LAYOUT_FILL = "CONTEXT_LAYOUT_FILL";
        var CONTEXT_GRID_DIMENSIONS = "CONTEXT_GRID_DIMENSIONS";
        var CONTEXT_GRID_TRANSLATION = "CONTEXT_GRID_TRANSLATION";
        var CONTEXT_EDIT_GLOBAL_GRID = "CONTEXT_EDIT_GLOBAL_GRID";
        var CONTEXT_END_EDIT_GLOBAL_GRID = "CONTEXT_END_EDIT_GLOBAL_GRID";

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
                    },
                    'CONTEXT_NEW_YT_PLAYER': {
                        name: "New YouTube Player // Neuer YouTube Player",
                        icon: "fab fa-youtube"
                    }
                }
            }
        };

        var itemsMoreMenuItem = {
            CONTEXT_DUPLICATE: {name: "Duplicate // Klonen", icon: "far fa-clone"},
            CONTEXT_DO_ACTION: {name: "Do element action // Aktion des Elements ausführen", icon: "fas fa-bolt"},
            CONTEXT_MOVE_TO: {name: "Move element to other grid // Element zu anderem Grid verschieben", icon: "fas fa-file-export"},
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

        let visibleFn = () => !!vueApp.markedElement;
        let visibleFnFill = () => !new GridData({}, vueApp.gridData).isFull();
        var itemsMoreMenuButton = {
            CONTEXT_ACTION_EDIT: {name: "Edit // Bearbeiten", icon: "fas fa-edit", visible: () => (vueApp.markedElement && vueApp.markedElement.type === GridElement.ELEMENT_TYPE_NORMAL)},
            CONTEXT_ACTION_EDIT_ACTIONS: {name: "Actions // Aktionen", icon: "fas fa-bolt", visible: visibleFn},
            CONTEXT_ACTION_DELETE: {name: "Delete // Löschen", icon: "far fa-trash-alt", visible: visibleFn},
            CONTEXT_ACTION_DUPLICATE: {name: "Duplicate // Klonen", icon: "far fa-clone", visible: visibleFn},
            CONTEXT_ACTION_DO_ACTION: {name: "Do element action // Aktion des Elements ausführen", icon: "fas fa-bolt", visible: visibleFn},
            CONTEXT_MOVE_TO: {name: "Move element to other grid // Element zu anderem Grid verschieben", icon: "fas fa-file-export", visible: visibleFn},
            SEP0: "---------",
            CONTEXT_NEW_GROUP: itemsGlobal[CONTEXT_NEW_GROUP],
            'CONTEXT_FILL_EMPTY': {name: "Fill with empty elements // Mit leeren Elementen füllen", icon: "fas fa-fill", visible: visibleFnFill},
            'CONTEXT_DELETE_ALL': {name: "Delete all elements // Alle Elemente löschen", icon: "fas fa-minus-circle"},
            SEP1: "---------",
            'CONTEXT_GRID_DIMENSIONS': {
                name: "Change grid dimensions // Grid-Größe anpassen",
                icon: "fas fa-expand-arrows-alt"
            },
            'CONTEXT_GRID_TRANSLATION': {
                name: "Translate grid // Grid übersetzen",
                icon: "fas fa-language"
            },
            'CONTEXT_LAYOUT_FILL': {name: "Fill gaps // Lücken füllen", icon: "fas fa-angle-double-left"},
            'CONTEXT_EDIT_GLOBAL_GRID': {name: "Edit global grid // Globales Grid bearbeiten", icon: "fas fa-globe", visible: !!vueApp.metadata.globalGridId && vueApp.metadata.globalGridActive && vueApp.metadata.globalGridId !== vueApp.gridData.id},
            'CONTEXT_END_EDIT_GLOBAL_GRID': {name: "End edit global grid // Bearbeitung globales Grid beenden", icon: "fas fa-globe", visible: vueApp.metadata.globalGridId === vueApp.gridData.id},
        };

        $('.grid-container').on('click', function (event) {
            if (vueApp) {
                let id = null;
                let element = event.target;
                while (!id && element.parentNode) {
                    id = $(element).attr('data-id');
                    element = element.parentNode;
                }
                vueApp.markElement(id);
            }
        });

        $.contextMenu({
            selector: '.item[data-type="ELEMENT_TYPE_NORMAL"]',
            callback: function (key, options) {
                var elementId = $(this).attr('data-id');
                handleContextMenu(key, elementId);
            },
            items: itemsElemNormal,
            zIndex: 10
        });

        $.contextMenu({
            selector: '.item[data-type!="ELEMENT_TYPE_NORMAL"]',
            callback: function (key, options) {
                var elementId = $(this).attr('data-id');
                handleContextMenu(key, elementId);
            },
            items: itemsElemSpecial,
            zIndex: 10
        });

        $.contextMenu({
            selector: '.grid-container',
            callback: function (key, options) {
                handleContextMenu(key);
            },
            items: itemsGlobal,
            zIndex: 10
        });

        $.contextMenu({
            selector: '#moreButton',
            callback: function (key, options) {
                handleContextMenu(key);
            },
            trigger: 'left',
            items: itemsMoreMenuButton,
            zIndex: 10
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
                    vueApp.removeElement(elementId);
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
                case CONTEXT_NEW_YT_PLAYER: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_YT_PLAYER);
                    break;
                }
                case CONTEXT_DELETE_ALL: {
                    vueApp.clearElements();
                    break;
                }
                case CONTEXT_FILL_EMPTY: {
                    vueApp.fillElements();
                    break;
                }
                case CONTEXT_LAYOUT_FILL: {
                    vueApp.fillGaps();
                    break;
                }
                case CONTEXT_GRID_DIMENSIONS: {
                    vueApp.showDimensionsModal = true;
                    break;
                }
                case CONTEXT_GRID_TRANSLATION: {
                    vueApp.showTranslateModal = true;
                    break;
                }
                case CONTEXT_ACTION_EDIT:
                    vueApp.editElement(vueApp.markedElement.id);
                    vueApp.markElement(null);
                    break;
                case CONTEXT_ACTION_EDIT_ACTIONS:
                    vueApp.editActions(vueApp.markedElement.id);
                    vueApp.markElement(null);
                    break;
                case CONTEXT_ACTION_DELETE:
                    vueApp.removeElement(vueApp.markedElement.id);
                    vueApp.markElement(null);
                    break;
                case CONTEXT_ACTION_DUPLICATE:
                    gridInstance.duplicateElement(vueApp.markedElement.id);
                    vueApp.markElement(null);
                    break;
                case CONTEXT_ACTION_DO_ACTION:
                    actionService.doAction(vueApp.gridData.id, vueApp.markedElement.id);
                    vueApp.markElement(null);
                    break;
                case CONTEXT_MOVE_TO:
                    vueApp.editElementId = elementId || vueApp.markedElement.id;
                    vueApp.markElement(null);
                    vueApp.showMoveModal = true;
                    break;
                case CONTEXT_EDIT_GLOBAL_GRID:
                    Router.toEditGrid(vueApp.metadata.globalGridId);
                    break;
                case CONTEXT_END_EDIT_GLOBAL_GRID:
                    Router.toEditGrid(vueApp.metadata.lastOpenedGridId);
                    break;
            }
        }
    }

    export default vueConfig;
</script>

<style scoped>
</style>
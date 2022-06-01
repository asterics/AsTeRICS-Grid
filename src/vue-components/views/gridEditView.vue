<template>
    <div v-cloak v-if="gridData" class="box">
        <header class="srow header" role="toolbar">
            <header-icon class="left"></header-icon>
            <button tabindex="30" @click="back" :aria-label="$t('editingOff')" class="spaced small left">
                <i class="fas fa-eye"></i>
                <span class="hide-mobile">{{ $t('editingOff') }}</span>
            </button>
            <button tabindex="33" id="moreButton" :aria-label="$t('more')" class="spaced"><i class="fas fa-ellipsis-v"></i> <span class="hide-mobile">{{ $t('more') }}</span></button>
            <div class="spaced btn-group">
                <button tabindex="31" @click="undo" :aria-label="$t('undo')" :disabled="!canUndo || doingUndoRedo" class="small"><i class="fas fa-undo"></i> <span class="hide-mobile">{{ $t('undo') }}</span></button>
                <button tabindex="32" @click="redo"  :aria-label="$t('redo')" :disabled="!canRedo || doingUndoRedo" class="small spaced"><i class="fas fa-redo"></i> <span class="hide-mobile">{{ $t('redo') }}</span></button>
            </div>
        </header>
        <div>
            <edit-element v-if="showModal === GridElement.ELEMENT_TYPE_NORMAL" v-bind:edit-element-id-param="editElementId" :grid-instance="getGridInstance()" :grid-data-id="gridData.id" @close="showModal = null" @mark="markElement" @actions="(id) => {editElementId = id; showActionsModal = true}"/>
            <edit-youtube-element v-if="showModal === GridElement.ELEMENT_TYPE_YT_PLAYER" :grid-data="gridData" :edit-element-id="editElementId" @close="showModal = null" @reload="reload"/>
            <edit-collect-element v-if="showModal === GridElement.ELEMENT_TYPE_COLLECT" :grid-data="gridData" :edit-element-id="editElementId" @close="showModal = null" @reload="reload"/>
        </div>
        <div>
            <add-multiple-modal v-if="showMultipleModal" v-bind:grid-data="gridData" :grid-instance="getGridInstance()" @close="showMultipleModal = false"/>
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
        <div class="srow content">
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
    import $ from '../../js/externals/jquery.js';
    import {Grid} from "../../js/grid.js";
    import {dataService} from "../../js/service/data/dataService";
    import {Router} from "./../../js/router.js";
    import {i18nService} from "../../js/service/i18nService";

    import EditElement from '../modals/editElement.vue'
    import AddMultipleModal from '../modals/addMultipleModal.vue'
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
    import EditCollectElement from "../modals/editCollectElement.vue";
    import EditYoutubeElement from "../modals/editYoutubeElement.vue";
    import {GridElementCollect} from "../../js/model/GridElementCollect.js";
    import {GridActionCollectElement} from "../../js/model/GridActionCollectElement.js";

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
                showMultipleModal: false,
                showDimensionsModal: false,
                showMoveModal: false,
                showTranslateModal: false,
                showModal: '',
                editElementId: null,
                showGrid: false,
                constants: constants,
                markedElement: null,
                GridElement: GridElement
            }
        },
        components: {
            EditCollectElement, EditYoutubeElement,
            GridTranslateModal,
            ElementMoveModal,
            GridDimensionModal, EditElement, AddMultipleModal, HeaderIcon
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
                let editElement = this.gridData.gridElements.filter(e => e.id === elementId)[0];
                if (editElement) {
                    this.showModal = editElement.type;
                }
            },
            removeElement(id) {
                let thiz = this;
                gridInstance.removeElement(id).then(newGridData => {
                    thiz.gridData = newGridData;
                });
            },
            newElement(type) {
                if (type === GridElement.ELEMENT_TYPE_NORMAL) {
                    this.editElementId = null;
                    this.showModal = GridElement.ELEMENT_TYPE_NORMAL;
                } else {
                    let newPos = new GridData(this.gridData).getNewXYPos();
                    let constructor = type === GridElement.ELEMENT_TYPE_COLLECT ? GridElementCollect : GridElement;
                    let newElement = new constructor({
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
                    if (type === GridElement.ELEMENT_TYPE_COLLECT) {
                        let playText = new GridActionCollectElement({
                            action: GridActionCollectElement.COLLECT_ACTION_SPEAK
                        });
                        newElement.actions = [playText];
                    }
                    this.gridData.gridElements.push(newElement);
                    gridInstance.updateGridWithUndo(this.gridData);
                }
            },
            newElements() {
                this.showMultipleModal = true;
            },
            clearElements() {
                if (confirm(i18nService.t('CONFIRM_DELETE_ALL_ELEMS'))) {
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
                thiz.showGrid = true;
            });
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
        var CONTEXT_DELETE = "CONTEXT_DELETE";
        var CONTEXT_FILL_EMPTY = "CONTEXT_FILL_EMPTY";
        var CONTEXT_DELETE_ALL = "CONTEXT_DELETE_ALL";

        let CONTEXT_ACTION_EDIT = 'CONTEXT_ACTION_EDIT';
        let CONTEXT_ACTION_DELETE = 'CONTEXT_ACTION_DELETE';
        let CONTEXT_ACTION_DUPLICATE = 'CONTEXT_ACTION_DUPLICATE';
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
                name: i18nService.t('new'), icon: "fas fa-plus-circle", items: {
                    'CONTEXT_NEW_SINGLE': {name: i18nService.t('newElement'), icon: "fas fa-plus"},
                    'CONTEXT_NEW_MASS': {name: i18nService.t('manyNewElements'), icon: "fas fa-clone"},
                    'CONTEXT_NEW_COLLECT': {
                        name: i18nService.t('newCollectElement'),
                        icon: "fas fa-ellipsis-h"
                    },
                    'CONTEXT_NEW_PREDICT': {
                        name: i18nService.t('newPredictionElement'),
                        icon: "fas fa-magic"
                    },
                    'CONTEXT_NEW_YT_PLAYER': {
                        name: i18nService.t('newYouTubePlayer'),
                        icon: "fab fa-youtube"
                    }
                }
            }
        };

        var itemsMoreMenuItem = {
            CONTEXT_DUPLICATE: {name: i18nService.t('clone'), icon: "far fa-clone"},
            CONTEXT_DO_ACTION: {name: i18nService.t('doElementAction'), icon: "fas fa-bolt"},
            CONTEXT_MOVE_TO: {name: i18nService.t('moveElementToOtherGrid'), icon: "fas fa-file-export"},
        };

        var itemsElemNormal = {
            CONTEXT_EDIT: {name: i18nService.t('edit'), icon: "fas fa-edit"},
            CONTEXT_DELETE: {name: i18nService.t('delete'), icon: "far fa-trash-alt"},
            CONTEXT_MORE_GROUP: {
                name: i18nService.t('more'), icon: "fas fa-bars", items: itemsMoreMenuItem
            }
        };

        let itemsElemSpecial = JSON.parse(JSON.stringify(itemsElemNormal));
        delete itemsElemSpecial[CONTEXT_EDIT];

        let visibleFn = () => !!vueApp.markedElement;
        let visibleFnFill = () => !new GridData({}, vueApp.gridData).isFull();
        var itemsMoreMenuButton = {
            CONTEXT_ACTION_EDIT: {name: i18nService.t('edit'), icon: "fas fa-edit", visible: () => (vueApp.markedElement && [GridElement.ELEMENT_TYPE_NORMAL, GridElement.ELEMENT_TYPE_YT_PLAYER].indexOf(vueApp.markedElement.type) !== -1)},
            CONTEXT_ACTION_DELETE: {name: i18nService.t('delete'), icon: "far fa-trash-alt", visible: visibleFn},
            CONTEXT_ACTION_DUPLICATE: {name: i18nService.t('clone'), icon: "far fa-clone", visible: visibleFn},
            CONTEXT_ACTION_DO_ACTION: {name: i18nService.t('doElementAction'), icon: "fas fa-bolt", visible: visibleFn},
            CONTEXT_MOVE_TO: {name: i18nService.t('moveElementToOtherGrid'), icon: "fas fa-file-export", visible: visibleFn},
            SEP0: "---------",
            CONTEXT_NEW_GROUP: itemsGlobal[CONTEXT_NEW_GROUP],
            'CONTEXT_FILL_EMPTY': {name: i18nService.t('fillWithEmptyElements'), icon: "fas fa-fill", visible: visibleFnFill},
            'CONTEXT_DELETE_ALL': {name: i18nService.t('deleteAllElements'), icon: "fas fa-minus-circle"},
            SEP1: "---------",
            'CONTEXT_GRID_DIMENSIONS': {
                name: i18nService.t('changeGridDimensions'),
                icon: "fas fa-expand-arrows-alt"
            },
            'CONTEXT_GRID_TRANSLATION': {
                name: i18nService.t('translateGrid'),
                icon: "fas fa-language"
            },
            'CONTEXT_LAYOUT_FILL': {name: i18nService.t('fillGaps'), icon: "fas fa-angle-double-left"},
            'CONTEXT_EDIT_GLOBAL_GRID': {name: i18nService.t('editGlobalGrid'), icon: "fas fa-globe", visible: !!vueApp.metadata.globalGridId && vueApp.metadata.globalGridActive && vueApp.metadata.globalGridId !== vueApp.gridData.id},
            'CONTEXT_END_EDIT_GLOBAL_GRID': {name: i18nService.t('endEditGlobalGrid'), icon: "fas fa-globe", visible: vueApp.metadata.globalGridId === vueApp.gridData.id},
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
            selector: '.item[data-type="ELEMENT_TYPE_NORMAL"],.item[data-type="ELEMENT_TYPE_YT_PLAYER"],.item[data-type="ELEMENT_TYPE_COLLECT"]',
            callback: function (key, options) {
                var elementId = $(this).attr('data-id');
                handleContextMenu(key, elementId);
            },
            items: itemsElemNormal,
            zIndex: 10
        });

        $.contextMenu({
            selector: '.item[data-type!="ELEMENT_TYPE_NORMAL"][data-type!="ELEMENT_TYPE_YT_PLAYER"][data-type!="ELEMENT_TYPE_COLLECT"]',
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
                case CONTEXT_DELETE: {
                    vueApp.removeElement(elementId);
                    break;
                }
                case CONTEXT_NEW_SINGLE: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_NORMAL);
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
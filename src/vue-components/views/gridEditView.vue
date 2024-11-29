<template>
    <div class="box">
        <header class="srow header" role="toolbar">
            <header-icon class="left"></header-icon>
            <button tabindex="30" @click="back" :aria-label="$t('editingOff')" class="spaced small left">
                <i class="fas fa-eye"></i>
                <span class="hide-mobile">{{ $t('editingOff') }}</span>
            </button>
            <button tabindex="33" id="moreButton" :aria-label="$t('more')" class="spaced"><i class="fas fa-ellipsis-v"></i> <span class="hide-mobile">{{ $t('more') }}</span></button>
            <div id="moreButtonMenu"></div>
            <div class="spaced btn-group">
                <button tabindex="31" @click="undo" :aria-label="$t('undo')" :disabled="doingUndoRedo|| !undoService.canUndo()" class="small"><i class="fas fa-undo"></i> <span class="hide-mobile">{{ $t('undo') }}</span></button>
                <button tabindex="32" @click="redo"  :aria-label="$t('redo')" :disabled="doingUndoRedo || !undoService.canRedo()" class="small spaced"><i class="fas fa-redo"></i> <span class="hide-mobile">{{ $t('redo') }}</span></button>
            </div>
        </header>
        <div>
            <edit-element v-if="showEditModal" v-bind:edit-element-id-param="editElementId" :undo-service="undoService" :grid-data-id="gridData.id" @reload="reload" @close="showEditModal = false" @mark="markElement" @actions="(id) => {editElementId = id; showActionsModal = true}"/>
        </div>
        <div>
            <add-multiple-modal v-if="showMultipleModal" v-bind:grid-data="gridData" :undo-service="undoService" @reload="reload" @close="showMultipleModal = false"/>
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
        <div>
            <set-navigation-modal v-if="showNavigateModal" :grid-id="gridData.id" :grid-element-id="editElementId" @close="showNavigateModal = false" @reload="reload"></set-navigation-modal>
        </div>
        <div class="srow content" id="contentContainer" v-if="!(metadata && gridData && gridData.gridElements.length > 0)">
            <div v-if="!showGrid" class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin"/>
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
        <div class="srow content" v-if="metadata && gridData && gridData.gridElements.length > 0" style="max-width: 100%; min-height: 0">
            <app-grid-editable id="grid-container" :grid-data="gridData" :metadata="metadata"/>
        </div>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
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
    import SetNavigationModal from "../modals/setNavigationModal.vue";
    import {GridActionYoutube} from "../../js/model/GridActionYoutube";
    import {printService} from "../../js/service/printService";
    import {GridElementCollect} from "../../js/model/GridElementCollect.js";
    import {GridActionCollectElement} from "../../js/model/GridActionCollectElement.js";
    import {pouchDbService} from "../../js/service/data/pouchDbService.js";
    import {MainVue} from "../../js/vue/mainVue.js";
    import {stateService} from "../../js/service/stateService.js";
    import AppGridEditable from '../grid-display/appGridEditable.vue';
    import { UndoService } from '../../js/service/data/undoService';

    let vueApp = null;
    let gridInstance = null;

    let vueConfig = {
        props: ['gridId', 'highlightId'],
        data() {
            return {
                gridData: null,
                metadata: null,
                canUndo: false,
                canRedo: false,
                undoService: new UndoService(),
                doingUndoRedo: false,
                showMultipleModal: false,
                showDimensionsModal: false,
                showNavigateModal: false,
                showMoveModal: false,
                showTranslateModal: false,
                showEditModal: false,
                editElementId: null,
                showGrid: false,
                constants: constants,
                markedElement: null
            }
        },
        components: {
            AppGridEditable,
            SetNavigationModal,
            GridTranslateModal,
            ElementMoveModal,
            GridDimensionModal, EditElement, AddMultipleModal, HeaderIcon
        },
        methods: {
            setDimensions: function (rows, cols) {
                this.gridData.rowCount = rows;
                this.gridData.minColumnCount = cols;
                this.undoService.updateGrid(this.gridData);
            },
            fillGaps: function () {
                gridUtil.moveAllAsPossible(this.gridData, constants.DIR_LEFT);
                this.undoService.updateGrid(this.gridData);
            },
            normalizeGrid: function () {
                gridUtil.normalizeGrid(this.gridData);
                this.undoService.updateGrid(this.gridData);
            },
            undo: async function () {
                this.doingUndoRedo = true;
                this.gridData = await this.undoService.doUndo();
                this.doingUndoRedo = false;
            },
            redo: async function () {
                this.doingUndoRedo = true;
                this.gridData = await this.undoService.doRedo();
                this.doingUndoRedo = false;
            },
            async reload(gridData) {
                gridData = gridData || (await dataService.getGrid(this.gridData.id));
                this.gridData = JSON.parse(JSON.stringify(gridData));
            },
            back() {
                if (this.metadata && this.metadata.globalGridId === this.gridData.id) {
                    Router.toMain();
                } else {
                    Router.toGrid(this.gridData.id);
                }
            },
            editElement(elementId) {
                this.editElementId = elementId;
                let editElement = this.gridData.gridElements.filter(e => e.id === elementId)[0];
                if (editElement) {
                    this.showEditModal = true;
                }
            },
            removeElement(id) {
                this.gridData.gridElements = this.gridData.gridElements.filter((el) => el.id !== id);
                this.undoService.updateGrid(this.gridData);
            },
            duplicateElement(id) {
                this.gridData = gridUtil.duplicateElement(this.gridData, id);
                this.undoService.updateGrid(this.gridData);
            },
            newElement(type) {
                if (type === GridElement.ELEMENT_TYPE_NORMAL) {
                    this.editElementId = null;
                    this.showEditModal = true;
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
                    this.undoService.updateGrid(this.gridData);
                }
            },
            newElements() {
                this.showMultipleModal = true;
            },
            clearElements() {
                if (confirm(i18nService.t('CONFIRM_DELETE_ALL_ELEMS'))) {
                    this.gridData.gridElements = [];
                    this.undoService.updateGrid(this.gridData);
                }
            },
            fillElements() {
                let elements = gridUtil.getFillElements(this.gridData);
                this.gridData.gridElements = this.gridData.gridElements.concat(elements);
                this.undoService.updateGrid(this.gridData);
            },
            reloadFn(event, updatedIds, updatedDocs, deletedIds) {
                if (vueApp && deletedIds.includes(vueApp.gridId)) {
                    Router.toManageGrids();
                    return;
                }
                if (vueApp && updatedIds.includes(vueApp.gridData.id) && gridInstance && gridInstance.isInitialized()) {
                    let gridData = new GridData(updatedDocs.filter(doc => doc.id === vueApp.gridData.id)[0]);
                    if (!gridData.isEqual(vueApp.gridData)) {
                        log.debug('reloading on remote update...');
                        vueApp.reload(gridData);
                    }
                } else if (updatedIds.includes(vueApp.metadata.id) && gridInstance && gridInstance.isInitialized()) {
                    let metadata = updatedDocs.filter(doc => doc.id === vueApp.metadata.id)[0];
                    if (metadata && JSON.stringify(metadata.colorConfig) !== JSON.stringify(vueApp.metadata.colorConfig)) {
                        vueApp.reload();
                    }
                }
            },
            markElement(id) {
                if (!id) {
                    return;
                }
                util.throttle(() => {
                    $('.grid-item-content').removeClass('marked');
                    if (!this.markedElement || this.markedElement.id !== id) {
                        this.markedElement = !id ? null : this.gridData.gridElements.filter(el => el.id === id)[0];
                        $('#' + id).addClass('marked');
                    } else {
                        this.markedElement = null;
                    }
                }, null, 200, "MARK_ELEMENT");
            },
            getGridInstance() {
                return gridInstance;
            },
            handleClickEvent(event) {
                if (vueApp) {
                    let id = null;
                    let element = event.target;
                    while (!id && element.parentNode) {
                        id = $(element).attr('data-id');
                        element = element.parentNode;
                    }
                    vueApp.markElement(id);
                }
            },
            highlightElement() {
                if (this.highlightId) {
                    $(`#${this.highlightId}`).addClass('highlight');
                    setTimeout(() => {
                        $(`#${this.highlightId}`).removeClass('highlight');
                    }, 4000);
                }
            },
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
        },
        mounted: function () {
            pouchDbService.pauseSync();
            let thiz = this;
            vueApp = thiz;
            dataService.getGrid(this.gridId).then(gridData => {
                if (!gridData) {
                    log.warn('grid not found! gridId: ' + this.gridId);
                    Router.toMain();
                    return Promise.reject();
                }
                thiz.gridData = JSON.parse(JSON.stringify(gridData));
                stateService.setCurrentGrid(thiz.gridData);
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
                return Promise.resolve();
            }).then(() => {
                initContextmenu();
                thiz.showGrid = true;
                thiz.highlightElement();
            });

            $('#contentContainer').on('click', this.handleClickEvent);
        },
        beforeDestroy() {
            pouchDbService.resumeSync();
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            $('#contentContainer').off('click', this.handleClickEvent);
            vueApp = null;
            if (gridInstance) {
                gridInstance.destroy();
                gridInstance = null;
            }
            $.contextMenu('destroy');
        }
    };

    function initContextmenu() {
        //see https://swisnl.github.io/jQuery-contextMenu/demo.html

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
        var CONTEXT_LAYOUT_NORMALIZE = "CONTEXT_LAYOUT_NORMALIZE";
        var CONTEXT_GRID_DIMENSIONS = "CONTEXT_GRID_DIMENSIONS";
        var CONTEXT_GRID_NAVIGATION = "CONTEXT_GRID_NAVIGATION";
        var CONTEXT_GRID_TRANSLATION = "CONTEXT_GRID_TRANSLATION";
        var CONTEXT_EDIT_GLOBAL_GRID = "CONTEXT_EDIT_GLOBAL_GRID";
        var CONTEXT_END_EDIT_GLOBAL_GRID = "CONTEXT_END_EDIT_GLOBAL_GRID";
        var CONTEXT_SEARCH = "CONTEXT_SEARCH";

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

        var itemsElemNormal = {
            CONTEXT_ACTION_EDIT: {name: i18nService.t('edit'), icon: "fas fa-edit"},
            CONTEXT_ACTION_DELETE: {name: i18nService.t('delete'), icon: "far fa-trash-alt"},
            CONTEXT_ACTION_DUPLICATE: {name: i18nService.t('clone'), icon: "far fa-clone"},
            SEP1: "---------",
            CONTEXT_GRID_NAVIGATION: {name: i18nService.t('navigateToOtherGrid'), icon: "fas fa-arrow-right"},
            CONTEXT_MOVE_TO: {name: i18nService.t('moveElementToOtherGrid'), icon: "fas fa-file-export"},
            CONTEXT_ACTION_DO_ACTION: {name: i18nService.t('doElementAction'), icon: "fas fa-bolt"},
        };

        let visibleFn = () => !!vueApp.markedElement;
        let visibleFnFill = () => !new GridData({}, vueApp.gridData).isFull();
        var itemsMoreMenuButton = {
            CONTEXT_ACTION_EDIT: {name: i18nService.t('edit'), icon: "fas fa-edit", visible: visibleFn},
            CONTEXT_ACTION_DELETE: {name: i18nService.t('delete'), icon: "far fa-trash-alt", visible: visibleFn},
            CONTEXT_ACTION_DUPLICATE: {name: i18nService.t('clone'), icon: "far fa-clone", visible: visibleFn},
            CONTEXT_GRID_NAVIGATION: {name: i18nService.t('navigateToOtherGrid'), icon: "fas fa-arrow-right", visible: visibleFn},
            CONTEXT_MOVE_TO: {name: i18nService.t('moveElementToOtherGrid'), icon: "fas fa-file-export", visible: visibleFn},
            CONTEXT_ACTION_DO_ACTION: {name: i18nService.t('doElementAction'), icon: "fas fa-bolt", visible: visibleFn},
            separator: { "type": "cm_separator", visible: () => (vueApp.markedElement)},
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
            'CONTEXT_LAYOUT_NORMALIZE': {name: i18nService.t('normalizeGridLayout'), icon: "fas fa-th"},
            'CONTEXT_EDIT_GLOBAL_GRID': {name: i18nService.t('editGlobalGrid'), icon: "fas fa-globe", visible: !!vueApp.metadata.globalGridId && vueApp.metadata.globalGridActive && vueApp.metadata.globalGridId !== vueApp.gridData.id},
            'CONTEXT_END_EDIT_GLOBAL_GRID': {name: i18nService.t('endEditGlobalGrid'), icon: "fas fa-globe", visible: vueApp.metadata.globalGridId === vueApp.gridData.id},
            SEP2: "---------",
            'CONTEXT_SEARCH': {name: i18nService.t('searchBtnTitle'), icon: "fas fa-search"},
        };

        $.contextMenu({
            selector: '.element-container',
            callback: function (key, options) {
                let elementId = $(this).attr('id');
                handleContextMenu(key, elementId);
            },
            items: itemsElemNormal,
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
            appendTo: '#moreButtonMenu',
            callback: function (key, options) {
                handleContextMenu(key);
            },
            trigger: 'left',
            items: itemsMoreMenuButton,
            zIndex: 10
        });

        function handleContextMenu(key, elementId) {
            switch (key) {
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
                case CONTEXT_LAYOUT_NORMALIZE: {
                    vueApp.normalizeGrid();
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
                case CONTEXT_GRID_NAVIGATION: {
                    vueApp.editElementId = elementId || vueApp.markedElement.id;
                    vueApp.markElement(null);
                    vueApp.showNavigateModal = true;
                    break;
                }
                case CONTEXT_ACTION_EDIT:
                    vueApp.editElement(elementId || vueApp.markedElement.id);
                    vueApp.markElement(null);
                    break;
                case CONTEXT_ACTION_DELETE:
                    vueApp.removeElement(elementId || vueApp.markedElement.id);
                    vueApp.markElement(null);
                    break;
                case CONTEXT_ACTION_DUPLICATE:
                    vueApp.duplicateElement(elementId || vueApp.markedElement.id);
                    vueApp.markElement(null);
                    break;
                case CONTEXT_ACTION_DO_ACTION:
                    actionService.doAction(vueApp.gridData.id, elementId || vueApp.markedElement.id);
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
                case CONTEXT_SEARCH:
                    MainVue.showSearchModal();
                    break;
            }
        }
    }

    export default vueConfig;
</script>

<style scoped>
</style>
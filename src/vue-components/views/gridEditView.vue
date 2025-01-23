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
            <edit-element v-if="showEditModal" v-bind:edit-element-id-param="editElementId" :undo-service="undoService" :grid-data-id="gridData.id" :new-position="newPosition" @reload="reload" @close="showEditModal = false" @mark="markElement" @actions="(id) => {editElementId = id; showActionsModal = true}"/>
        </div>
        <div>
            <add-multiple-modal v-if="showMultipleModal" v-bind:grid-data="gridData" :undo-service="undoService" @reload="reload" @close="showMultipleModal = false"/>
        </div>
        <div>
            <grid-settings-modal v-if="showGridSettingsModal" :grid-data-param="gridData" :is-global-grid="metadata.globalGridId === gridData.id" @reload="reload" @close="showGridSettingsModal = false;" :undo-service="undoService"/>
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
        <div class="srow content" id="contentContainer" v-if="!(metadata && gridData)">
            <div v-if="!showGrid" class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin"/>
            </div>
        </div>
        <div class="srow content d-flex" v-if="metadata && gridData" style="min-height: 0">
            <app-grid-display id="grid-container" @changed="handleChange" :grid-data="gridData" :metadata="metadata" :editable="true" @interacted="onInteracted" @interactstart="onInteractStart" @interactend="onInteractEnd"/>
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
    import {util} from "../../js/util/util";
    import GridSettingsModal from "../modals/gridSettingsModal.vue";
    import {gridUtil} from "../../js/util/gridUtil";
    import ElementMoveModal from "../modals/elementMoveModal.vue";
    import GridTranslateModal from "../modals/gridTranslateModal.vue";
    import SetNavigationModal from "../modals/setNavigationModal.vue";
    import {GridActionYoutube} from "../../js/model/GridActionYoutube";
    import {GridElementCollect} from "../../js/model/GridElementCollect.js";
    import {GridActionCollectElement} from "../../js/model/GridActionCollectElement.js";
    import {pouchDbService} from "../../js/service/data/pouchDbService.js";
    import {MainVue} from "../../js/vue/mainVue.js";
    import {stateService} from "../../js/service/stateService.js";
    import { UndoService } from '../../js/service/data/undoService';
    import { gridLayoutUtil } from '../grid-layout/utils/gridLayoutUtil';
    import { collectElementService } from '../../js/service/collectElementService';
    import AppGridDisplay from '../grid-display/appGridDisplay.vue';

    let vueApp = null;

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
                showGridSettingsModal: false,
                showNavigateModal: false,
                showMoveModal: false,
                showTranslateModal: false,
                showEditModal: false,
                editElementId: null,
                showGrid: false,
                constants: constants,
                markedElement: null,
                lastInteraction: {},
                newPosition: null,
                touchstartTimeoutHandler: null,
                isInteracting: false
            }
        },
        components: {
            AppGridDisplay,
            SetNavigationModal,
            GridTranslateModal,
            ElementMoveModal,
            GridSettingsModal, EditElement, AddMultipleModal, HeaderIcon
        },
        methods: {
            moveAll: function(dir) {
                this.gridData.gridElements = gridLayoutUtil.moveAsPossible(this.gridData.gridElements, this.gridData.gridElements, dir, {
                    outOfBounds: false,
                    gridWidth: gridUtil.getWidthWithBounds(this.gridData),
                    gridHeight: gridUtil.getHeightWithBounds(this.gridData)
                });
                this.updateGridWithUndo();
            },
            normalizeGrid: function () {
                gridUtil.ensureUniqueIds(this.gridData.gridElements);
                this.gridData.gridElements = gridLayoutUtil.normalizeGrid(this.gridData.gridElements);
                this.updateGridWithUndo();
            },
            async handleChange(newElements) {
                this.gridData.gridElements = newElements;
                await this.updateGridWithUndo();
            },
            undo: async function () {
                this.doingUndoRedo = true;
                this.gridData = await this.undoService.doUndo();
                this.doingUndoRedo = false;
                this.$forceUpdate();
            },
            redo: async function () {
                this.doingUndoRedo = true;
                this.gridData = await this.undoService.doRedo();
                this.doingUndoRedo = false;
                this.$forceUpdate();
            },
            async updateGridWithUndo() {
                await this.undoService.updateGrid(this.gridData);
                this.$forceUpdate();
            },
            async reload(gridData) {
                gridData = gridData || (await dataService.getGrid(this.gridData.id));
                this.gridData = gridData;
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
                this.updateGridWithUndo();
            },
            async duplicateElement(id) {
                let element = gridLayoutUtil.getElementById(this.gridData.gridElements, id);
                let duplicate = gridUtil.duplicateElement(element);
                this.gridData.gridElements = gridLayoutUtil.insertDuplicate(this.gridData.gridElements, element, duplicate, {
                    gridWidth: this.gridData.minColumnCount,
                    gridHeight: this.gridData.rowCount
                });
                this.updateGridWithUndo();
            },
            newElement(type, useInteractionPos) {
                if (type === GridElement.ELEMENT_TYPE_NORMAL) {
                    this.editElementId = null;
                    this.newPosition = useInteractionPos ? this.lastInteraction : null;
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
                    this.updateGridWithUndo();
                }
            },
            newElements() {
                this.showMultipleModal = true;
            },
            clearElements() {
                if (confirm(i18nService.t('CONFIRM_DELETE_ALL_ELEMS'))) {
                    this.gridData.gridElements = [];
                    this.updateGridWithUndo();
                }
            },
            fillElements() {
                let elements = gridUtil.getFillElements(this.gridData);
                this.gridData.gridElements = this.gridData.gridElements.concat(elements);
                this.updateGridWithUndo();
            },
            reloadFn(event, updatedIds, updatedDocs, deletedIds) {
                if (vueApp && deletedIds.includes(vueApp.gridId)) {
                    Router.toManageGrids();
                    return;
                }
                if (vueApp && updatedIds.includes(vueApp.gridData.id)) {
                    let gridData = new GridData(updatedDocs.filter(doc => doc.id === vueApp.gridData.id)[0]);
                    if (!gridData.isEqual(vueApp.gridData)) {
                        log.debug('reloading on remote update...');
                        vueApp.reload(gridData);
                    }
                } else if (updatedIds.includes(vueApp.metadata.id)) {
                    let metadata = updatedDocs.filter(doc => doc.id === vueApp.metadata.id)[0];
                    if (metadata && JSON.stringify(metadata.colorConfig) !== JSON.stringify(vueApp.metadata.colorConfig)) {
                        vueApp.reload();
                    }
                }
            },
            markElement(id) {
                $('.element-container').removeClass('marked');
                $('.element-container').css('z-index', 'unset');
                if (!id) {
                    this.markedElement = null;
                    return;
                }
                util.throttle(() => {
                    if (!this.markedElement || this.markedElement.id !== id) {
                        this.markedElement = !id ? null : this.gridData.gridElements.filter(el => el.id === id)[0];
                        $('#' + id).addClass('marked');
                        $('#' + id).css('z-index', 1);
                    } else {
                        this.markedElement = null;
                    }
                }, null, 200, "MARK_ELEMENT");
            },
            handleClickEvent(event) {
                if (this.isInteracting) {
                    return;
                }
                if (vueApp) {
                    let id = null;
                    let element = event.target;
                    while (!id && element.parentNode) {
                        if (element.className.includes('element-container')) {
                            id = element.id;
                        }
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
            onInteracted(x, y) {
                this.lastInteraction.x = x;
                this.lastInteraction.y = y;
            },
            onTouchstart(event) {
                if (!constants.IS_SAFARI) {
                    return;
                }
                this.touchstartTimeoutHandler = setTimeout(() => {
                    let element = event.target;
                    const position = { pageX: event.pageX, pageY: event.pageY };
                    const newEvent = $.Event('contextmenu', position);
                    while (element) {
                        if (element.className.includes('element-container')) {
                            $(element).trigger(newEvent);
                            break;
                        }
                        if (element.id === 'grid-container') {
                            $(element).trigger(newEvent);
                            break;
                        }
                        element = element.parentElement;
                    }
                }, 600)
            },
            onTouchEnd() {
                clearTimeout(this.touchstartTimeoutHandler);
            },
            onInteractStart() {
                this.isInteracting = true;
            },
            onInteractEnd() {
                setTimeout(() => {
                    this.isInteracting = false; // reset after click event is fired
                }, 100)
            }
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
        },
        mounted: async function () {
            pouchDbService.pauseSync();
            let thiz = this;
            vueApp = thiz;

            let gridData = await dataService.getGrid(this.gridId);
            if (!gridData) {
                log.warn('grid not found! gridId: ' + this.gridId);
                Router.toMain();
                return Router.toMain();
            }
            thiz.gridData = JSON.parse(JSON.stringify(gridData));
            stateService.setCurrentGrid(thiz.gridData);

            let savedMetadata = await dataService.getMetadata();
            thiz.metadata = JSON.parse(JSON.stringify(savedMetadata));
            if (thiz.metadata.globalGridId !== thiz.gridData.id) {
                thiz.metadata.lastOpenedGridId = thiz.gridData.id;
                await dataService.saveMetadata(thiz.metadata);
            }

            initContextmenu();
            thiz.showGrid = true;
            thiz.highlightElement();
            collectElementService.initWithElements(this.gridData.gridElements);
            this.$nextTick(() => {
                let container = document.getElementById('grid-container');
                container.addEventListener('click', this.handleClickEvent);
                container.addEventListener('touchstart', this.onTouchstart);
                container.addEventListener('touchmove', this.onTouchEnd);
                container.addEventListener('touchcancel', this.onTouchEnd);
                container.addEventListener('touchend', this.onTouchEnd);
            });
        },
        beforeDestroy() {
            pouchDbService.resumeSync();
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            let container = document.getElementById('grid-container');
            if (container) {
                container.removeEventListener('click', this.handleClickEvent);
                container.removeEventListener('touchstart', this.onTouchstart);
                container.removeEventListener('touchmove', this.onTouchEnd);
                container.removeEventListener('touchcancel', this.onTouchEnd);
                container.removeEventListener('touchend', this.onTouchEnd);
            }
            vueApp = null;
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

        var CONTEXT_LAYOUT_ALL_UP = "CONTEXT_LAYOUT_ALL_UP";
        var CONTEXT_LAYOUT_ALL_RIGHT = "CONTEXT_LAYOUT_ALL_RIGHT";
        var CONTEXT_LAYOUT_ALL_DOWN = "CONTEXT_LAYOUT_ALL_DOWN";
        var CONTEXT_LAYOUT_ALL_LEFT = "CONTEXT_LAYOUT_ALL_LEFT";
        var CONTEXT_LAYOUT_NORMALIZE = "CONTEXT_LAYOUT_NORMALIZE";
        var CONTEXT_GRID_SETTINGS = "CONTEXT_GRID_SETTINGS";
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

        let itemsLayout = {
            name: i18nService.t('layout'), icon: 'fas fa-th-large', items: {
                'CONTEXT_LAYOUT_ALL_UP': { name: i18nService.t('moveAllUp'), icon: 'fas fa-angle-double-up' },
                'CONTEXT_LAYOUT_ALL_RIGHT': { name: i18nService.t('moveAllRight'), icon: 'fas fa-angle-double-right' },
                'CONTEXT_LAYOUT_ALL_DOWN': { name: i18nService.t('moveAllDown'), icon: 'fas fa-angle-double-down' },
                'CONTEXT_LAYOUT_ALL_LEFT': { name: i18nService.t('moveAllLeft'), icon: 'fas fa-angle-double-left' },
                'CONTEXT_LAYOUT_NORMALIZE': { name: i18nService.t('normalizeGridLayout'), icon: 'fas fa-th' }
            }
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
            CONTEXT_GROUP_LAYOUT: itemsLayout,
            'CONTEXT_GRID_SETTINGS': {
                name: i18nService.t('gridSettings'),
                icon: "fas fa-expand-arrows-alt"
            },
            'CONTEXT_GRID_TRANSLATION': {
                name: i18nService.t('translateGrid'),
                icon: "fas fa-language"
            },
            'CONTEXT_EDIT_GLOBAL_GRID': {name: i18nService.t('editGlobalGrid'), icon: "fas fa-globe", visible: !!vueApp.metadata.globalGridId && vueApp.metadata.globalGridActive && vueApp.metadata.globalGridId !== vueApp.gridData.id},
            'CONTEXT_END_EDIT_GLOBAL_GRID': {name: i18nService.t('endEditGlobalGrid'), icon: "fas fa-globe", visible: vueApp.metadata.globalGridId === vueApp.gridData.id},
            SEP2: "---------",
            'CONTEXT_SEARCH': {name: i18nService.t('searchBtnTitle'), icon: "fas fa-search"},
        };

        let ORIGIN_MORE_BTN = "ORIGIN_MORE_BTN";

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
            selector: '#grid-container',
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
                handleContextMenu(key, null, ORIGIN_MORE_BTN);
            },
            trigger: 'left',
            items: itemsMoreMenuButton,
            zIndex: 10
        });

        function handleContextMenu(key, elementId, origin) {
            switch (key) {
                case CONTEXT_NEW_SINGLE: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_NORMAL, origin !== ORIGIN_MORE_BTN);
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
                case CONTEXT_LAYOUT_ALL_UP: {
                    vueApp.moveAll(gridLayoutUtil.DIR_UP);
                    break;
                }
                case CONTEXT_LAYOUT_ALL_RIGHT: {
                    vueApp.moveAll(gridLayoutUtil.DIR_RIGHT);
                    break;
                }
                case CONTEXT_LAYOUT_ALL_DOWN: {
                    vueApp.moveAll(gridLayoutUtil.DIR_DOWN);
                    break;
                }
                case CONTEXT_LAYOUT_ALL_LEFT: {
                    vueApp.moveAll(gridLayoutUtil.DIR_LEFT);
                    break;
                }
                case CONTEXT_LAYOUT_NORMALIZE: {
                    vueApp.normalizeGrid();
                    break;
                }
                case CONTEXT_GRID_SETTINGS: {
                    vueApp.showGridSettingsModal = true;
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
                    Router.toEditGrid(vueApp.gridData.globalGridId || vueApp.metadata.globalGridId);
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
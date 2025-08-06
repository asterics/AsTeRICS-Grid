<template>
    <div class="box">
        <header class="srow header" role="toolbar" v-show="!propTransferObject">
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
        <header class="d-flex align-items-center transfer-props-header" role="toolbar" v-if="propTransferObject">
            <div class="me-5">
                <strong class="me-2">
                    <i class="fas fa-angle-double-right"></i>&nbsp;<span class="d-none d-sm-inline-block"><span>{{ $t('transferProperties') }}</span>:</span>
                </strong>
                <span><span>{{ $t('selectTargetElements') }}</span>...</span>
            </div>
            <button class="mb-0 me-2" @click="stopPropTransfer" :title="$t('cancel')"><i class="fas fa-times"/> <span class="d-none d-lg-inline-block">{{ $t('cancel') }}</span></button>
            <button class="mb-0" @click="applyPropTransfer" :title="$t('ok')"><i class="fas fa-check"/> <span class="d-none d-lg-inline-block">{{ $t('ok') }}</span></button>
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
            <grid-translate-modal v-if="showTranslateModal" :grid-data-id="gridData.id" @close="showTranslateModal = false" @reload="reload"/>
        </div>
        <div>
            <set-navigation-modal v-if="showNavigateModal" :grid-id="gridData.id" :grid-element-id="editElementId" @close="showNavigateModal = false" @reload="reload"></set-navigation-modal>
        </div>
        <div>
            <transfer-props-modal v-if="showPropTransferModal" :grid-id="gridData.id" :grid-element-id="editElementId" @start="(propTransferObject) => startPropTransfer(propTransferObject)" @close="showPropTransferModal = false"></transfer-props-modal>
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
    import { GridElementLive } from '../../js/model/GridElementLive';
    import { liveElementService } from '../../js/service/liveElementService';
    import TransferPropsModal from '../modals/transferPropsModal.vue';
    import { GridElementMatrixConversation } from '../../js/model/GridElementMatrixConversation';

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
                showTranslateModal: false,
                showPropTransferModal: false,
                showEditModal: false,
                editElementId: null,
                showGrid: false,
                constants: constants,
                markedElementIds: [],
                lastInteraction: {},
                newPosition: null,
                touchstartTimeoutHandler: null,
                isInteracting: false,
                unmarkTimeoutHandler: null,
                shiftKeyHold: false,
                ctrlKeyHold: false,
                usingTouchscreen: false,
                propTransferObject: null
            }
        },
        components: {
            TransferPropsModal,
            AppGridDisplay,
            SetNavigationModal,
            GridTranslateModal,
            GridSettingsModal, EditElement, AddMultipleModal, HeaderIcon
        },
        methods: {
            configPropTransfer(id) {
                if (!id && this.markedElementIds.length !== 1) {
                    return;
                }
                this.editElementId = id || this.markedElementIds[0];
                this.showPropTransferModal = true;
            },
            configPropTransferAll(id) {
                if (!id && this.markedElementIds.length !== 1) {
                    return;
                }
                this.editElementId = id || this.markedElementIds[0];
                let propTransferObject = gridUtil.getPropTransferObjectAll(this.getElement(this.editElementId));
                this.startPropTransfer(propTransferObject);
            },
            configPropTransferAppearance(id) {
                if (!id && this.markedElementIds.length !== 1) {
                    return;
                }
                this.editElementId = id || this.markedElementIds[0];
                let propTransferObject = gridUtil.getPropTransferObjectAppearance(this.getElement(this.editElementId));
                this.startPropTransfer(propTransferObject);
            },
            startPropTransfer(propTransferObject) {
                this.unmarkAll();
                $('.element-container').removeClass('transfer-prop-source');
                $('#' + this.editElementId).addClass('transfer-prop-source');
                this.propTransferObject = propTransferObject;
                this.$nextTick(() => {
                    $.contextMenu('destroy'); // if executed in same context, re-adding context menu after prop transfer does not work anymore for the transfer source element
                })
            },
            async applyPropTransfer() {
                let actionElements = this.getElementsForAction();
                for (let element of actionElements) {
                    for (let path of gridUtil.getAllPropTransferPaths()) {
                        if (this.propTransferObject[path] !== constants.PROP_TRANSFER_DONT_CHANGE) {
                            this.$set(element, path, this.propTransferObject[path]);
                        }
                    }
                }
                await this.updateGridWithUndo();
                this.stopPropTransfer();
            },
            stopPropTransfer() {
                this.propTransferObject = null;
                $('#' + this.editElementId).removeClass('transfer-prop-source');
                this.unmarkAll();
                initContextmenu();
            },
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
                if (!this.undoService.canUndo()) {
                    return;
                }
                this.doingUndoRedo = true;
                this.gridData = await this.undoService.doUndo();
                this.doingUndoRedo = false;
                this.$forceUpdate();
            },
            redo: async function () {
                if (!this.undoService.canRedo()) {
                    return;
                }
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
                liveElementService.updateOnce({ elements: this.gridData.gridElements, forceUpdate: true });
            },
            back() {
                if (this.metadata && this.metadata.globalGridId === this.gridData.id) {
                    Router.toMain();
                } else {
                    Router.toGrid(this.gridData.id);
                }
            },
            editElement(elementId = null) {
                if (!elementId && this.markedElementIds.length !== 1) {
                    return;
                }
                this.editElementId = elementId || this.markedElementIds[0];
                let editElement = this.gridData.gridElements.filter(e => e.id === this.editElementId)[0];
                if (editElement) {
                    this.showEditModal = true;
                }
                this.unmarkAll();
            },
            removeElements(shouldIncludeId = null) {
                let removeIds = this.getElementIdsForAction(shouldIncludeId);
                if (!removeIds.length) {
                    return;
                }
                this.gridData.gridElements = this.gridData.gridElements.filter((el) => !removeIds.includes(el.id));
                this.updateGridWithUndo();
                this.unmarkAll();
            },
            copyElements(shouldIncludeId = null) {
                let elements = this.getElementsForAction(shouldIncludeId);
                util.gridElementsToClipboard(elements);
                this.unmarkAll();
            },
            copyAllElements() {
                util.gridElementsToClipboard(this.gridData.gridElements);
            },
            cutElements(shouldIncludeId = null) {
                let elements = this.getElementsForAction(shouldIncludeId);
                if (!elements.length) {
                    return;
                }
                util.gridElementsToClipboard(elements);
                this.removeElements(shouldIncludeId);
                this.unmarkAll();
            },
            async duplicateElements(shouldIncludeId = null) {
                let elements = this.getElementsForAction(shouldIncludeId);
                if (!elements.length) {
                    return;
                }
                let duplicates = gridUtil.duplicateElements(elements);
                this.unmarkAll();
                if (duplicates.length === 1) {
                    this.gridData.gridElements = gridLayoutUtil.insertDuplicate(this.gridData.gridElements, elements[0], duplicates[0], {
                        gridWidth: this.gridData.minColumnCount,
                        gridHeight: this.gridData.rowCount
                    });
                    return this.updateGridWithUndo();
                } else {
                    return this.pasteElements(duplicates);
                }
            },
            hideUnhideElements(shouldIncludeId = null) {
                let elements = this.getElementsForAction(shouldIncludeId);
                if (!elements.length) {
                    return;
                }
                let allHidden = elements.every(e => e.hidden);
                for (let element of elements) {
                    element.hidden = !allHidden;
                }
                this.updateGridWithUndo();
                this.unmarkAll();
            },
            async newElement(type, useInteractionPos) {
                if (type === GridElement.ELEMENT_TYPE_NORMAL) {
                    this.editElementId = null;
                    this.newPosition = useInteractionPos && this.lastInteraction.x !== undefined ? this.lastInteraction : null;
                    this.showEditModal = true;
                } else {
                    let showEdit = false;
                    let newPos = new GridData(this.gridData).getNewXYPos();
                    let baseProperties = {
                        type: type,
                        x: newPos.x,
                        y: newPos.y
                    };
                    let newElement = new GridElement(baseProperties);
                    if (type === GridElement.ELEMENT_TYPE_YT_PLAYER) {
                        let playPause = new GridActionYoutube({
                            action: GridActionYoutube.actions.YT_TOGGLE
                        });
                        newElement.actions = [playPause];
                    } else if (type === GridElement.ELEMENT_TYPE_COLLECT) {
                        newElement = new GridElementCollect(baseProperties);
                        let playText = new GridActionCollectElement({
                            action: GridActionCollectElement.COLLECT_ACTION_SPEAK
                        });
                        newElement.actions = [playText];
                    } else if (type === GridElement.ELEMENT_TYPE_LIVE) {
                        newElement = new GridElementLive(baseProperties);
                        showEdit = true;
                    } else if (type === GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION) {
                        newElement = new GridElementMatrixConversation(baseProperties);
                    }
                    this.gridData.gridElements.push(newElement);
                    await this.updateGridWithUndo();
                    if (showEdit) {
                        this.editElementId = newElement.id;
                        this.showEditModal = true;
                    }
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
            unmarkAll() {
                $('.element-container').removeClass('marked');
                this.markedElementIds = [];
            },
            markAll() {
                $('.element-container').addClass('marked');
                this.markedElementIds = this.gridData.gridElements.map(e => e.id);
            },
            async markElement(id) {
                if (!id) {
                    return;
                }
                await this.$nextTick();
                util.throttle(() => {
                    if (this.shiftKeyHold && this.markedElementIds.length) {
                        let allElems = this.gridData.gridElements;
                        let clickedElem = allElems.find(e => e.id === id);
                        let markedElems = this.markedElementIds.map(elId => allElems.find(e => e.id === elId));
                        let firstMarked = markedElems[0];
                        let addElems = allElems.filter(e => gridUtil.isWithinElements(clickedElem, firstMarked, e));
                        this.unmarkAll();
                        this.addToMarkedInternal(firstMarked.id); // keep firstMarked first for consistent behaviour
                        for (let addElem of addElems) {
                            this.addToMarkedInternal(addElem.id);
                        }
                        return;
                    }
                    if (this.markedElementIds.length === 1 && this.markedElementIds.includes(id)) {
                        // unselect single marked element on second click
                        this.unmarkAll();
                        return;
                    }
                    if (!this.usingTouchscreen && !this.ctrlKeyHold) {
                        // no multi-select mode on desktop without Ctrl
                        this.unmarkAll();
                    }
                    if (!this.markedElementIds.includes(id)) {
                        this.addToMarkedInternal(id);
                    } else {
                        this.markedElementIds = this.markedElementIds.filter(elId => elId !== id);
                        $('#' + id).removeClass('marked');
                    }
                }, null, 200, "MARK_ELEMENT");
            },
            addToMarkedInternal(id) {
                if (id && !this.markedElementIds.includes(id)) {
                    this.markedElementIds.push(id);
                    $('#' + id).addClass('marked');
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
            async pasteElements(elements = null) {
                this.unmarkAll();
                elements = elements || await util.getGridElementsFromClipboard();
                if (!elements.length) {
                    return;
                } else if (elements.length === 1) {
                    let element = elements[0];
                    element.width = 1;
                    element.height = 1;
                    element.x = this.lastInteraction.x !== undefined ? this.lastInteraction.x : gridUtil.getHeightWithBounds(this.gridData);
                    element.y = this.lastInteraction.y !== undefined ? this.lastInteraction.y : 0;
                    this.gridData.gridElements.push(element);
                    this.gridData.gridElements = gridLayoutUtil.resolveCollisions(this.gridData.gridElements, element);
                } else if (gridLayoutUtil.elementsCanBeInsertedAt(this.gridData, elements, this.lastInteraction)) {
                    let normalized = gridLayoutUtil.normalizePositions(elements);
                    for (let element of normalized) {
                        element.x += this.lastInteraction.x;
                        element.y += this.lastInteraction.y;
                    }
                    this.gridData.gridElements = this.gridData.gridElements.concat(normalized);
                } else {
                    let firstEmptyRow = gridUtil.getHeight(this.gridData);
                    let minY = Math.min(...elements.map(e => e.y));
                    elements = elements.map(el => {
                        el.y += firstEmptyRow - minY;
                        return el;
                    });
                    this.gridData.gridElements = this.gridData.gridElements.concat(elements);
                }
                this.updateGridWithUndo();
            },
            getElements(ids = []) {
                return this.gridData.gridElements.filter(el => ids.includes(el.id));
            },
            getElement(id) {
                return this.gridData.gridElements.find(el => el.id === id);
            },
            getElementIdsForAction(shouldIncludeId = null) {
                let ids = this.markedElementIds;
                if (shouldIncludeId && !this.markedElementIds.includes(shouldIncludeId)) {
                    this.unmarkAll();
                    ids = [shouldIncludeId];
                }
                return ids;
            },
            getElementsForAction(shouldIncludeId = null) {
                return this.getElements(this.getElementIdsForAction(shouldIncludeId));
            },
            onInteracted(x, y) {
                this.lastInteraction.x = x;
                this.lastInteraction.y = y;
            },
            onClick(event) {
                if (vueApp && !this.isInteracting) {
                    let elementId = $(event.target).closest('.element-container').attr('id');
                    let containerElement = $(event.target).closest('#grid-container')[0];
                    if (elementId) {
                        vueApp.markElement(elementId);
                    } else {
                        this.unmarkAll();
                        if (containerElement && this.usingTouchscreen) {
                            const newEvent = new MouseEvent("contextmenu", {
                                bubbles: true,
                                cancelable: true,
                                clientX: event.clientX,
                                clientY: event.clientY,
                                pageX: event.pageX,
                                pageY: event.pageY,
                                screenX: event.screenX,
                                screenY: event.screenY,
                                button: 2
                            });
                            containerElement.dispatchEvent(newEvent);
                        }
                    }
                }
            },
            onTouchstart(event) {
                this.usingTouchscreen = true;
                if (!constants.IS_SAFARI) {
                    return;
                }
                this.touchstartTimeoutHandler = setTimeout(() => {
                    const newEvent = new MouseEvent("contextmenu", {
                        bubbles: true,
                        cancelable: true,
                        clientX: event.touches[0].clientX,
                        clientY: event.touches[0].clientY,
                        pageX: event.touches[0].pageX,
                        pageY: event.touches[0].pageY,
                        screenX: event.touches[0].screenX,
                        screenY: event.touches[0].screenY
                    });
                    let closestElement = $(event.target).closest('.element-container')[0];
                    let containerElement = $(event.target).closest('#grid-container')[0];
                    let dispatchElement = closestElement || containerElement;
                    if (dispatchElement) {
                        dispatchElement.dispatchEvent(newEvent);
                    }
                }, 600)
            },
            onTouchEnd() {
                clearTimeout(this.touchstartTimeoutHandler);
            },
            onInteractStart() {
                this.isInteracting = true;
                this.unmarkTimeoutHandler = setTimeout(() => {
                    this.unmarkAll();
                }, 100);
            },
            onInteractEnd() {
                setTimeout(() => {
                    this.isInteracting = false; // reset after click event is fired
                }, 100);
                clearTimeout(this.unmarkTimeoutHandler);
            },
            onContextMenu(event) {
                if (this.propTransferObject) {
                    event.preventDefault();
                    return;
                }
                let clickedId = $(event.target).closest('.element-container').attr('id');
                if (!clickedId || !this.markedElementIds.includes(clickedId)) {
                    this.unmarkAll();
                }
                this.addToMarkedInternal(clickedId);
            },
            onKeyUp() {
                this.shiftKeyHold = false;
                this.ctrlKeyHold = false;
            },
            onKeyDown(event) {
                if (this.showMultipleModal || this.showGridSettingsModal || this.showNavigateModal || this.showTranslateModal || this.showPropTransferModal || this.showEditModal) {
                    return;
                }
                const ctrlOrMeta = constants.IS_MAC ? event.metaKey : event.ctrlKey;
                this.ctrlKeyHold = ctrlOrMeta;
                const isUndoRedo = event.key.toLocaleUpperCase() === 'Z' || event.code === 'KeyZ';
                if (!event.repeat) {
                    if (event.code === 'Delete') {
                        event.preventDefault();
                        this.removeElements();
                    }
                    if (event.key === 'Enter') {
                        if (this.propTransferObject) {
                            this.applyPropTransfer();
                        }
                    }
                    if (event.code === 'Escape') {
                        this.unmarkAll();
                        if (this.propTransferObject) {
                            this.stopPropTransfer();
                        }
                    }
                    if (event.shiftKey) {
                        this.shiftKeyHold = true;
                    }
                    if (ctrlOrMeta) {
                        if (event.shiftKey && event.code === 'KeyA') {
                            event.preventDefault();
                            this.configPropTransferAll();
                            return;
                        }
                        if (event.shiftKey && event.code === 'KeyC') {
                            event.preventDefault();
                            this.configPropTransferAppearance();
                            return;
                        }
                        if (event.shiftKey && event.code === 'KeyP') {
                            event.preventDefault();
                            this.configPropTransfer();
                            return;
                        }
                        if (event.shiftKey && event.code === 'KeyI') {
                            event.preventDefault();
                            this.newElements();
                            return;
                        }
                        if (event.code === 'KeyI') {
                            event.preventDefault();
                            this.newElement(GridElement.ELEMENT_TYPE_NORMAL);
                            return;
                        }
                        if (event.code === 'KeyA') {
                            event.preventDefault();
                            this.markAll();
                        }
                        if (event.code === 'KeyD') {
                            event.preventDefault();
                            this.duplicateElements();
                        }
                        if (event.code === 'KeyE') {
                            event.preventDefault();
                            this.editElement();
                        }
                        if (event.code === 'KeyC') {
                            event.preventDefault();
                            this.copyElements();
                        }
                        if (event.code === 'KeyX') {
                            event.preventDefault();
                            this.cutElements();
                        }
                        if (event.code === 'KeyV') {
                            event.preventDefault();
                            this.pasteElements();
                        }
                        if (event.code === 'KeyH') {
                            event.preventDefault();
                            this.hideUnhideElements();
                        }
                        if (isUndoRedo && !event.shiftKey) {
                            event.preventDefault();
                            this.undo();
                        }
                        if (isUndoRedo && event.shiftKey) {
                            event.preventDefault();
                            this.redo();
                        }
                        if (event.code === 'ArrowUp') {
                            event.preventDefault();
                            this.moveAll(gridLayoutUtil.DIR_UP);
                        }
                        if (event.code === 'ArrowRight') {
                            event.preventDefault();
                            this.moveAll(gridLayoutUtil.DIR_RIGHT);
                        }
                        if (event.code === 'ArrowDown') {
                            event.preventDefault();
                            this.moveAll(gridLayoutUtil.DIR_DOWN);
                        }
                        if (event.code === 'ArrowLeft') {
                            event.preventDefault();
                            this.moveAll(gridLayoutUtil.DIR_LEFT);
                        }
                    }
                }
            }
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            document.addEventListener("keydown", this.onKeyDown);
            document.addEventListener("keyup", this.onKeyUp);
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
            this.$nextTick(() => {
                let container = document.getElementById('grid-container');
                container.addEventListener('click', this.onClick);
                container.addEventListener('touchstart', this.onTouchstart);
                container.addEventListener('touchmove', this.onTouchEnd);
                container.addEventListener('touchcancel', this.onTouchEnd);
                container.addEventListener('touchend', this.onTouchEnd);
                container.addEventListener("contextmenu", this.onContextMenu);
                collectElementService.initWithGrid(this.gridData);
                liveElementService.updateOnce({ elements: this.gridData.gridElements });
            });
        },
        beforeDestroy() {
            pouchDbService.resumeSync();
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            document.removeEventListener("keydown", this.onKeyDown);
            document.removeEventListener("keyup", this.onKeyUp);
            let container = document.getElementById('grid-container');
            if (container) {
                container.removeEventListener('click', this.onClick);
                container.removeEventListener('touchstart', this.onTouchstart);
                container.removeEventListener('touchmove', this.onTouchEnd);
                container.removeEventListener('touchcancel', this.onTouchEnd);
                container.removeEventListener('touchend', this.onTouchEnd);
                container.removeEventListener("contextmenu", this.onContextMenu);
            }
            vueApp = null;
            $.contextMenu('destroy');
        }
    };

    function initContextmenu() {
        //see https://swisnl.github.io/jQuery-contextMenu/demo.html

        var CONTEXT_FILL_EMPTY = "CONTEXT_FILL_EMPTY";
        var CONTEXT_COPY_ALL = "CONTEXT_COPY_ALL";
        var CONTEXT_DELETE_ALL = "CONTEXT_DELETE_ALL";

        let CONTEXT_ACTION_EDIT = 'CONTEXT_ACTION_EDIT';
        let CONTEXT_ACTION_DELETE = 'CONTEXT_ACTION_DELETE';
        let CONTEXT_ACTION_DUPLICATE = 'CONTEXT_ACTION_DUPLICATE';
        let CONTEXT_ACTION_COPY = 'CONTEXT_ACTION_COPY';
        let CONTEXT_ACTION_CUT = 'CONTEXT_ACTION_CUT';
        let CONTEXT_ACTION_PASTE = 'CONTEXT_ACTION_PASTE';
        let CONTEXT_ACTION_DO_ACTION = 'CONTEXT_ACTION_DO_ACTION';

        var CONTEXT_NEW_GROUP = "CONTEXT_NEW_GROUP";
        var CONTEXT_NEW_GROUP_REDUCED = "CONTEXT_NEW_GROUP_REDUCED";
        var CONTEXT_NEW_SINGLE = "CONTEXT_NEW_SINGLE";
        var CONTEXT_NEW_MASS = "CONTEXT_NEW_MASS";
        var CONTEXT_NEW_COLLECT = "CONTEXT_NEW_COLLECT";
        var CONTEXT_NEW_PREDICT = "CONTEXT_NEW_PREDICT";
        var CONTEXT_NEW_YT_PLAYER = "CONTEXT_NEW_YT_PLAYER";
        var CONTEXT_NEW_LIVE = "CONTEXT_NEW_LIVE";
        var CONTEXT_NEW_MATRIX_CONVERSATION = "CONTEXT_NEW_MATRIX_CONVERSATION";

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

        let CONTEXT_QUICK_HIDE = "CONTEXT_QUICK_HIDE";
        let CONTEXT_PROPERTY_TRANSFER = "CONTEXT_PROPERTY_TRANSFER";
        let CONTEXT_PROPERTY_TRANSFER_APPEARANCE = "CONTEXT_PROPERTY_TRANSFER_APPEARANCE";
        let CONTEXT_PROPERTY_TRANSFER_ALL = "CONTEXT_PROPERTY_TRANSFER_ALL";

        let contextMenuNewGroup = {
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
                },
                'CONTEXT_NEW_LIVE': {
                    name: i18nService.t('newLiveElement'),
                    icon: "fas fa-star-of-life"
                },
                'CONTEXT_NEW_MATRIX_CONVERSATION': {
                    name: i18nService.t('newMatrixConversation'),
                    icon: "fas fa-comments"
                }
            }
        };

        var itemsGlobal = {
            'CONTEXT_NEW_SINGLE': {name: i18nService.t('newElement'), icon: "fas fa-plus"},
            'CONTEXT_NEW_MASS': {name: i18nService.t('manyNewElements'), icon: "fas fa-clone"},
            CONTEXT_ACTION_PASTE: {name: i18nService.t('paste'), icon: "far fa-clipboard"},
            CONTEXT_NEW_GROUP_REDUCED: JSON.parse(JSON.stringify(contextMenuNewGroup))
        };
        itemsGlobal[CONTEXT_NEW_GROUP_REDUCED].items[CONTEXT_NEW_SINGLE].visible = false;
        itemsGlobal[CONTEXT_NEW_GROUP_REDUCED].items[CONTEXT_NEW_MASS].visible = false;
        itemsGlobal[CONTEXT_NEW_GROUP_REDUCED].name = i18nService.t('newSpecialElement');

        let itemsTransferProps = {
            'CONTEXT_PROPERTY_TRANSFER_ALL': { name: i18nService.t('transferAll'), icon: 'fas fa-angle-double-right' },
            'CONTEXT_PROPERTY_TRANSFER_APPEARANCE': { name: i18nService.t('transferAppearance'), icon: 'fas fa-angle-double-right' },
            'CONTEXT_PROPERTY_TRANSFER': { name: i18nService.t('transferCustom'), icon: 'fas fa-angle-double-right' }
        };

        let visibleNormalFn = () => vueApp && vueApp.markedElementIds.length <= 1;
        let visibleTransferPropsFn = () => vueApp && vueApp.markedElementIds.length === 1;
        let itemsElemNormal = {
            CONTEXT_ACTION_EDIT: {name: i18nService.t('edit'), icon: "fas fa-edit", visible: visibleNormalFn},
            CONTEXT_ACTION_DELETE: {name: i18nService.t('delete'), icon: "far fa-trash-alt"},
            CONTEXT_ACTION_DUPLICATE: {name: i18nService.t('clone'), icon: "far fa-clone"},
            CONTEXT_QUICK_HIDE: { name: i18nService.t('hideUnhide'), icon: 'fas fa-eye-slash' },
            TRANSFER_PROPS: {name: i18nService.t('transferProperties'), icon: "fas fa-angle-double-right", items: itemsTransferProps, visible: visibleTransferPropsFn},
            SEP1: "---------",
            CONTEXT_ACTION_COPY: {name: i18nService.t('copy'), icon: "far fa-copy"},
            CONTEXT_ACTION_CUT: {name: i18nService.t('cut'), icon: "fas fa-cut"},
            CONTEXT_ACTION_PASTE: {name: i18nService.t('paste'), icon: "far fa-clipboard"},
            separator: { "type": "cm_separator", visible: visibleNormalFn},
            CONTEXT_GRID_NAVIGATION: {name: i18nService.t('navigateToOtherGrid'), icon: "fas fa-arrow-right", visible: visibleNormalFn},
            CONTEXT_ACTION_DO_ACTION: {name: i18nService.t('doElementAction'), icon: "fas fa-bolt", visible: visibleNormalFn},
        };

        let disabledFnFill = () => new GridData({}, vueApp.gridData).isFull();
        let itemsLayout = {
            name: i18nService.t('layout'), icon: 'fas fa-th-large', items: {
                'CONTEXT_LAYOUT_ALL_UP': { name: i18nService.t('moveAllUp'), icon: 'fas fa-angle-double-up' },
                'CONTEXT_LAYOUT_ALL_RIGHT': { name: i18nService.t('moveAllRight'), icon: 'fas fa-angle-double-right' },
                'CONTEXT_LAYOUT_ALL_DOWN': { name: i18nService.t('moveAllDown'), icon: 'fas fa-angle-double-down' },
                'CONTEXT_LAYOUT_ALL_LEFT': { name: i18nService.t('moveAllLeft'), icon: 'fas fa-angle-double-left' },
                SEP1: "---------",
                'CONTEXT_FILL_EMPTY': {name: i18nService.t('fillWithEmptyElements'), icon: "fas fa-fill", disabled: disabledFnFill},
                'CONTEXT_DELETE_ALL': {name: i18nService.t('deleteAllElements'), icon: "fas fa-minus-circle"},
                'CONTEXT_LAYOUT_NORMALIZE': { name: i18nService.t('normalizeGridLayout'), icon: 'fas fa-th' }
            }
        };

        let visibleFn = () => vueApp.markedElementIds.length >= 1;
        var itemsMoreMenuButton = {
            "SELECTED_ELEM_ACTIONS": {name: i18nService.t('selectedElementsContextMenu'), icon: "far fa-square", visible: visibleFn, items: itemsElemNormal},
            separator: { "type": "cm_separator", visible: visibleFn},
            CONTEXT_NEW_GROUP: contextMenuNewGroup,
            SEP0: "---------",
            'CONTEXT_COPY_ALL': {name: i18nService.t('copyAllElements'), icon: "fas fa-copy"},
            CONTEXT_ACTION_PASTE: {name: i18nService.t('paste'), icon: "far fa-clipboard"},
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
            zIndex: 100
        });

        $.contextMenu({
            selector: '#grid-container',
            callback: function (key, options) {
                handleContextMenu(key);
            },
            items: itemsGlobal,
            zIndex: 100
        });

        $.contextMenu({
            selector: '#moreButton',
            appendTo: '#moreButtonMenu',
            callback: function (key, options) {
                handleContextMenu(key, null, ORIGIN_MORE_BTN);
            },
            trigger: 'left',
            items: itemsMoreMenuButton,
            zIndex: 100
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
                case CONTEXT_NEW_LIVE: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_LIVE);
                    break;
                }
                case CONTEXT_NEW_MATRIX_CONVERSATION: {
                    vueApp.newElement(GridElement.ELEMENT_TYPE_MATRIX_CONVERSATION);
                    break;
                }
                case CONTEXT_COPY_ALL: {
                    vueApp.copyAllElements();
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
                case CONTEXT_PROPERTY_TRANSFER: {
                    vueApp.configPropTransfer(elementId);
                    break;
                }
                case CONTEXT_PROPERTY_TRANSFER_APPEARANCE: {
                    vueApp.configPropTransferAppearance(elementId);
                    break;
                }
                case CONTEXT_PROPERTY_TRANSFER_ALL: {
                    vueApp.configPropTransferAll(elementId);
                    break;
                }
                case CONTEXT_GRID_NAVIGATION: {
                    vueApp.editElementId = elementId;
                    vueApp.unmarkAll();
                    vueApp.showNavigateModal = true;
                    break;
                }
                case CONTEXT_ACTION_EDIT:
                    vueApp.editElement(elementId);
                    break;
                case CONTEXT_ACTION_DELETE:
                    vueApp.removeElements(elementId);
                    break;
                case CONTEXT_ACTION_DUPLICATE:
                    vueApp.duplicateElements(elementId);
                    break;
                case CONTEXT_QUICK_HIDE:
                    vueApp.hideUnhideElements(elementId);
                    break;
                case CONTEXT_ACTION_COPY:
                    vueApp.copyElements(elementId);
                    break;
                case CONTEXT_ACTION_CUT:
                    vueApp.cutElements(elementId);
                    break;
                case CONTEXT_ACTION_PASTE:
                    vueApp.pasteElements();
                    break;
                case CONTEXT_ACTION_DO_ACTION:
                    actionService.doAction(vueApp.gridData.id, elementId);
                    vueApp.unmarkAll();
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
header {
    border: 0;
}
.content {
    outline: 2px solid lightgray;
}
</style>
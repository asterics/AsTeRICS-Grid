<template>
    <div class="box" id="gridView" v-cloak>
        <header class="srow header" role="toolbar" v-if="metadata" v-show="!metadata.fullscreen">
            <header-icon class="left" v-show="!metadata.locked"></header-icon>
            <div class="btn-group left">
                <button tabindex="30" v-show="!metadata.locked" @click="toEditGrid()" class="spaced small" :aria-label="$t('editingOn')"><i class="fas fa-pencil-alt"/> <span class="hide-mobile">{{ $t('editingOn') }}</span></button>
                <button tabindex="31" id="inputConfigButton" v-show="!metadata.locked" class="small" :aria-label="$t('inputOptions')"><i class="fas fa-cog"></i> <span class="hide-mobile">{{ $t('inputOptions') }}</span></button>
                <div id="inputConfigMenu"></div>
            </div>
            <button tabindex="34" v-show="metadata.locked" @click="unlock()" class="small" :aria-label="$t('unlock')">
                <i class="fas fa-unlock"></i>
                <span class="hide-mobile">{{ $t('unlock') }}</span>
                <span v-if="unlockCounter !== unlockCount">{{unlockCounter}}</span>
            </button>
            <button tabindex="34" v-show="!metadata.locked" @click="MainVue.showSearchModal()" class="spaced small" :aria-label="$t('fullscreen')" :title="$t('searchBtnTitle')"><i class="fas fa-search"/> <span class="hide-mobile">{{ $t('search') }}</span></button>
            <button tabindex="33" v-show="!metadata.locked" @click="lock()" class="small" :aria-label="$t('lock')">
                <i class="fas fa-lock"></i>
                <span class="hide-mobile">{{ $t('lock') }}</span>
            </button>
            <button tabindex="32" @click="systemActionService.enterFullscreen()" class="spaced small" :aria-label="$t('fullscreen')"><i class="fas fa-expand"/> <span class="hide-mobile">{{ $t('fullscreen') }}</span></button>

        </header>
        <div class="srow content text-content" v-show="!gridData.gridElements">
            <div class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin" style="position: relative;"/>
            </div>
        </div>

        <component v-if="currentModal" :is="currentModal" ref="modal" @close="handleModalClose(); reinitInputMethods();"/>

        <mouse-modal v-if="showModal === modalTypes.MODAL_MOUSE" @close="showModal = null; reinitInputMethods();"/>
        <scanning-modal v-if="showModal === modalTypes.MODAL_SCANNING" @close="showModal = null; reinitInputMethods();"/>
        <sequential-input-modal v-if="showModal === modalTypes.MODAL_SEQUENTIAL" @close="showModal = null; reinitInputMethods();"/>
        <unlock-modal v-if="showModal === modalTypes.MODAL_UNLOCK" @unlock="unlock(true)" @close="showModal = null;"/>

        <div class="srow content spaced" v-show="viewInitialized && gridData.gridElements && gridData.gridElements.length === 0 && (!globalGridData || globalGridData.gridElements.length === 0)">
            <div style="margin-top: 2em">
                <i18n path="noElementsClickToEnterEdit" tag="span">
                    <template v-slot:link>
                        <a :href="'#grid/edit/' + gridData.id">{{ $t('editingOn') }}</a>
                    </template>
                </i18n>
            </div>
        </div>
        <div class="srow content" v-show="gridData.gridElements && (gridData.gridElements.length > 0 || (globalGridData && globalGridData.gridElements.length > 0))">
            <div v-if="!viewInitialized" class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin" style="position: relative"/>
            </div>
            <div id="grid-container" class="grid-container" :style="`background-color: ${backgroundColor}`">
            </div>
        </div>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import {L} from "../../js/util/lquery.js";
    import {Grid} from "../../js/grid.js";
    import {actionService} from "../../js/service/actionService";
    import {dataService} from "../../js/service/data/dataService";
    import {areService} from "../../js/service/areService";
    import {Router} from "./../../js/router.js";
    import {MetaData} from "../../js/model/MetaData.js";
    import {urlParamService} from "../../js/service/urlParamService";

    import {Scanner} from "../../js/input/scanning.js";
    import {Hover} from "../../js/input/hovering.js";
    import {Clicker} from "../../js/input/clicking.js";
    import {HuffmanInput} from "../../js/input/huffmanInput";
    import {DirectionInput} from "../../js/input/directionInput";
    import {SequentialInput} from "../../js/input/sequentialInput";

    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {constants} from "../../js/util/constants";
    import {GridData} from "../../js/model/GridData";
    import {i18nService} from "../../js/service/i18nService";
    import {util} from "../../js/util/util";
    import { modalDisplayMixin } from '../mixins/modalDisplayMixin.js';
    import ScanningModal from '../../vue-components/modals/input/scanningModal.vue'
    import MouseModal from "../modals/input/mouseModal.vue";
    import DirectionInputModal from "../modals/input/directionInputModal.vue";
    import HuffmanInputModal from "../modals/input/huffmanInputModal.vue";
    import SequentialInputModal from "../modals/input/sequentialInputModal.vue";
    import {speechService} from "../../js/service/speechService";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {imageUtil} from "../../js/util/imageUtil";
    import {audioUtil} from "../../js/util/audioUtil.js";
    import UnlockModal from "../modals/unlockModal.vue";
    import {printService} from "../../js/service/printService";
    import {MainVue} from "../../js/vue/mainVue.js";
    import {stateService} from "../../js/service/stateService.js";
    import { systemActionService } from '../../js/service/systemActionService';

    let vueApp = null;
    let gridInstance = null;
    let UNLOCK_COUNT = 8;
    let modalTypes = {
        MODAL_SCANNING: 'MODAL_SCANNING',
        MODAL_MOUSE: 'MODAL_MOUSE',
        MODAL_SEQUENTIAL: 'MODAL_SEQUENTIAL',
        MODAL_UNLOCK: 'MODAL_UNLOCK'
    };

    let vueConfig = {
        props: {
            gridId: String,
            skipThumbnailCheck: Boolean
        },
        mixins: [modalDisplayMixin],
        data() {
            return {
                gridData: {},
                globalGridData: null,
                metadata: null,
                updatedMetadataDoc: null,
                scanner: null,
                hover: null,
                clicker: null,
                directionInput: null,
                seqInput: null,
                huffmanInput: null,
                showModal: null,
                modalTypes: modalTypes,
                viewInitialized: false,
                unlockCount: UNLOCK_COUNT,
                unlockCounter: UNLOCK_COUNT,
                backgroundColor: 'white',
                MainVue: MainVue,
                highlightTimeoutHandler: null,
                highlightedElementId: null,
                systemActionService: systemActionService
            }
        },
        components: {
            UnlockModal,
            SequentialInputModal,
            HuffmanInputModal,
            DirectionInputModal,
            MouseModal,
            ScanningModal, HeaderIcon
        },
        methods: {
            openModal(modalType) {
                this.showModal = modalType;
                stopInputMethods();
            },
            lock() {
                let thiz = this;
                thiz.metadata.locked = true;
                thiz.unlockCounter = UNLOCK_COUNT;
                dataService.saveMetadata(thiz.metadata).then(() => {
                    this.setViewPropsLocked();
                });
            },
            unlock(force) {
                let thiz = this;
                if (!force && localStorageService.getAppSettings().unlockPasscode) {
                    thiz.showModal = modalTypes.MODAL_UNLOCK;
                    return;
                }
                thiz.unlockCounter--;
                util.debounce(function () {
                    thiz.unlockCounter = UNLOCK_COUNT;
                }, 3000);
                if (thiz.unlockCounter === 0 || force) {
                    thiz.metadata.locked = false;
                    dataService.saveMetadata(thiz.metadata).then(() => {
                        this.setViewPropsUnlocked();
                    });
                }
            },
            setViewPropsLocked() {
                $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                $(document).trigger(constants.EVENT_UI_LOCKED);

                // prevent zoom
                $('#viewPortMeta').attr('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
                $('#gridView').on('touchmove', this.preventZoomHandler);
            },
            setViewPropsUnlocked() {
                $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
                $(document).trigger(constants.EVENT_UI_UNLOCKED);

                //enable zoom
                $('#viewPortMeta').attr('content', 'width=device-width, initial-scale=1');
                $('body').attr('touch-action', '');
                $('#gridView').off('touchmove', this.preventZoomHandler);
            },
            preventZoomHandler(event) {
                event.preventDefault();
            },
            initInputMethods(continueRunningMethods) {
                let thiz = this;
                if (!gridInstance) {
                    return;
                }

                let inputConfig = thiz.metadata.inputConfig;
                let selectionListener = (item) => {
                    this.stopHighlightElements();
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(thiz.gridData.id, item.id);
                };
                let activeListener = (items, wrap, restarted) => {
                    if (!Array.isArray(items)) {
                        items = [items];
                    }
                    if (inputConfig.globalReadActive && items && items.length === 1 && items[0]) {
                        let text = items[0].ariaLabel || '';
                        let separatorIndex = text.indexOf(", ");
                        if (!inputConfig.globalReadAdditionalActions && separatorIndex !== -1 && separatorIndex !== 0) {
                            text = text.substring(0, separatorIndex);
                        }
                        speechService.speak(text, {
                            rate: inputConfig.globalReadActiveRate || 1
                        });
                    }

                    if (inputConfig.globalBeepFeedback) {
                        if (restarted) {
                            audioUtil.beepHighDouble();
                        } else if (wrap) {
                            audioUtil.beepHigh();
                        } else {
                            audioUtil.beep();
                        }
                    }
                };

                if (inputConfig.seqEnabled) {
                    thiz.seqInput = SequentialInput.getInstanceFromConfig(inputConfig, {
                        itemSelector: '.grid-item-content:not([data-empty="true"])',
                        selectionListener: selectionListener,
                        activeListener: activeListener
                    });
                    thiz.seqInput.start(continueRunningMethods);
                }

                if (inputConfig.dirEnabled) {
                    thiz.directionInput = DirectionInput.getInstanceFromConfig(inputConfig, '.grid-item-content:not([data-empty="true"])', 'scanFocus', selectionListener);
                    thiz.directionInput.start();
                }

                if (inputConfig.huffEnabled) {
                    this.huffmanInput = HuffmanInput.getInstanceFromConfig(inputConfig, '.grid-item-content', 'scanFocus', 'scanInactive', selectionListener);
                    this.huffmanInput.start();
                }

                if (inputConfig.scanEnabled) {
                    thiz.scanner = Scanner.getInstanceFromConfig(inputConfig, '.grid-item-content:not([data-empty="true"])', 'scanFocus', 'scanInactive');
                    thiz.scanner.setSelectionListener(selectionListener);
                    thiz.scanner.setActiveListener(activeListener);

                    gridInstance.setLayoutChangedStartListener(function () {
                        thiz.scanner.pauseScanning();
                    });
                    gridInstance.setLayoutChangedEndListener(function () {
                        thiz.scanner.resumeScanning();
                    });

                    thiz.scanner.startScanning(continueRunningMethods);
                }

                if (inputConfig.hoverEnabled) {
                    thiz.hover = Hover.getInstanceFromConfig(inputConfig, '.grid-item-content', {
                        activeListener: activeListener,
                        containerClass: '.grid-container li'
                    });
                    thiz.hover.setSelectionListener(selectionListener);
                    thiz.hover.startHovering();
                } else {
                    $('#touchElement').hide();
                }

                if (inputConfig.mouseclickEnabled || inputConfig.mouseDoubleClickEnabled) {
                    thiz.clicker = Clicker.getInstanceFromConfig(inputConfig, '.grid-item-content');
                    thiz.clicker.setSelectionListener(selectionListener);
                    thiz.clicker.startClickcontrol();
                }
            },
            reinitInputMethods(continueRunningMethods) {
                let thiz = this;
                stopInputMethods();
                dataService.getMetadata().then(newMetadata => {
                    thiz.metadata = JSON.parse(JSON.stringify(newMetadata));
                    initContextmenu(); //in order to update visualization of active input methods in context menu
                    thiz.initInputMethods(continueRunningMethods);
                });
            },
            reload(gridData) {
                if (gridData) {
                    this.gridData = JSON.parse(JSON.stringify(gridData));
                    stateService.setCurrentGrid(this.gridData);
                }
                return gridInstance.reinit(gridData).then(() => {
                    this.reinitInputMethods(true);
                    return Promise.resolve();
                });
            },
            highlightElements() {
                clearTimeout(this.highlightTimeoutHandler);
                let params = urlParamService.getSearchQueryParams();
                if (params.highlightIds) {
                    $(`#${params.highlightIds[0]}`).addClass('highlight');
                    this.highlightTimeoutHandler = setTimeout(() => {
                        this.stopHighlightElements();
                    }, 15000);
                    this.highlightedElementId = params.highlightIds[0];
                    params.highlightIds.shift();
                    params.highlightIds = params.highlightIds.length > 0 ? params.highlightIds : null;
                    urlParamService.setParamsToSearchQuery(params);
                }
            },
            stopHighlightElements() {
                if (this.highlightedElementId) {
                    $(`#${this.highlightedElementId}`).removeClass('highlight');
                    this.highlightedElementId = null;
                }
            },
            async onNavigateEvent(event, gridData, params) {
                if (gridData && this.gridData.id === gridData.id) {
                    this.highlightElements();
                    return; //prevent duplicated navigation to same grid
                }
                this.metadata.lastOpenedGridId = gridData.id;
                await this.reload(gridData);
                this.highlightElements();
                await dataService.saveMetadata(this.metadata);
                $(document).trigger(constants.EVENT_GRID_LOADED);
            },
            onReloadGrid() {
                this.reload();
            },
            toEditGrid() {
                Router.toEditGrid(this.gridData.id);
            },
            toManageGrids() {
                Router.toManageGrids();
            },
            toLogin() {
                Router.toLogin();
            },
            reloadFn(event, updatedIds, updatedDocs, deletedIds) {
                let thiz = this;
                if (!vueApp || !gridInstance || !gridInstance.isInitialized()) {
                    setTimeout(() => {
                        thiz.reloadFn(event, updatedIds, updatedDocs);
                    }, 500);
                    return;
                }
                if (deletedIds.includes(vueApp.gridId)) {
                    Router.toManageGrids();
                    return;
                }
                log.debug('got update event, ids updated:' + updatedIds);
                let updatedGridDoc = updatedDocs.filter(doc => (vueApp.gridData && doc.id === vueApp.gridData.id))[0];
                let hasUpdatedGlobalGrid = updatedDocs.filter(doc => (this.metadata && doc.id === this.metadata.globalGridId)).length > 0;
                this.updatedMetadataDoc = updatedDocs.filter(doc => (vueApp.metadata && doc.id === vueApp.metadata.id))[0] || this.updatedMetadataDoc;
                if (updatedGridDoc) {
                    vueApp.reload(new GridData(updatedGridDoc));
                } else if (hasUpdatedGlobalGrid) {
                    vueApp.reload();
                }
                if (this.updatedMetadataDoc && JSON.stringify(this.metadata.colorConfig) !== JSON.stringify(this.updatedMetadataDoc.colorConfig)) {
                    this.backgroundColor = this.updatedMetadataDoc.colorConfig.gridBackgroundColor;
                    vueApp.reload();
                }
                if (!localStorageService.getAppSettings().syncNavigation) {
                    return;
                }
                if (this.updatedMetadataDoc && this.updatedMetadataDoc.lastOpenedGridId !== vueApp.gridData.id) {
                    dataService.getGrid(this.updatedMetadataDoc.lastOpenedGridId).then(toGrid => {
                        if (!toGrid.hasOutdatedThumbnail()) {
                            Router.toLastOpenedGrid();
                        }
                    });
                    return;
                }
                if (this.updatedMetadataDoc && this.updatedMetadataDoc.fullscreen !== vueApp.metadata.fullscreen) {
                    if (this.updatedMetadataDoc.fullscreen) {
                        systemActionService.enterFullscreen(true);
                    } else {
                        $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
                    }
                }
                if (this.updatedMetadataDoc && this.updatedMetadataDoc.locked !== vueApp.metadata.locked) {
                    if (this.updatedMetadataDoc.locked) {
                        vueApp.lock();
                    } else {
                        vueApp.unlock(true);
                    }
                }
            },
            onSidebarOpen() {
                if (!vueApp || !vueApp.metadata) {
                    return;
                }
                vueApp.metadata.fullscreen = false;
                $(document).trigger(constants.EVENT_GRID_RESIZE);
            },
            resizeListener() {
                let thiz = this;
                util.debounce(function () {
                    if (thiz.huffmanInput) {
                        thiz.huffmanInput.reinit();
                    }
                }, 500);
            },
            contextMenuListener(event) {
                event.preventDefault();
            },
            async metadataUpdated() {
                this.metadata = await dataService.getMetadata();
            }
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            $(document).on(constants.EVENT_RELOAD_CURRENT_GRID, this.onReloadGrid);
            $(document).on(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
            $(document).on(constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE, this.onNavigateEvent);
            document.addEventListener('contextmenu', this.contextMenuListener);
            window.addEventListener('resize', this.resizeListener, true);
            $(document).on(constants.EVENT_GRID_RESIZE, this.resizeListener);
            $(document).on(constants.EVENT_METADATA_UPDATED, this.metadataUpdated);
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            $(document).off(constants.EVENT_RELOAD_CURRENT_GRID, this.onReloadGrid);
            $(document).off(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
            $(document).off(constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE, this.onNavigateEvent);
            document.removeEventListener('contextmenu', this.contextMenuListener);
            window.removeEventListener('resize', this.resizeListener, true);
            $(document).off(constants.EVENT_GRID_RESIZE, this.resizeListener);
            $(document).off(constants.EVENT_METADATA_UPDATED, this.metadataUpdated);
            stopInputMethods();
            this.setViewPropsUnlocked();
            $.contextMenu('destroy');
            vueApp = null;
            if (gridInstance) {
                gridInstance.destroy();
                gridInstance = null;
                printService.setGridInstance(null);
            }
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            dataService.getGlobalGrid().then(globalGrid => {
                thiz.globalGridData = globalGrid;
                return dataService.getGrid(thiz.gridId);
            }).then(async gridData => {
                if (!gridData) {
                    log.warn('grid not found! gridId: ' + this.gridId);
                    let grids = await dataService.getGrids(false, true);
                    if (grids && grids[0]) {
                        gridData = await dataService.getGrid(grids[0].id);
                    } else {
                        Router.toManageGrids();
                        return Promise.reject();
                    }
                }
                if (gridData.hasAREModel()) {
                    let areModel = gridData.getAREModel();
                    areService.uploadAndStartModel(areModel.dataBase64, gridData.getAREURL(), areModel.fileName);
                }
                thiz.gridData = JSON.parse(JSON.stringify(gridData));
                Router.addToGridHistory(thiz.gridData.id);
                return Promise.resolve();
            }).then(() => {
                return dataService.getMetadata();
            }).then((savedMetadata) => {
                let metadata = JSON.parse(JSON.stringify(savedMetadata || new MetaData()));
                this.backgroundColor = metadata.colorConfig.gridBackgroundColor;
                metadata.lastOpenedGridId = this.gridId;
                metadata.locked = metadata.locked === undefined ? urlParamService.isDemoMode() && dataService.getCurrentUser() === constants.LOCAL_DEMO_USERNAME : metadata.locked;
                if (metadata.locked) {
                    $(document).trigger(constants.EVENT_UI_LOCKED);
                }
                metadata.fullscreen = metadata.fullscreen === undefined ? urlParamService.isDemoMode() && dataService.getCurrentUser() === constants.LOCAL_DEMO_USERNAME : metadata.fullscreen;
                metadata.inputConfig.scanEnabled = urlParamService.isScanningEnabled() ? true : metadata.inputConfig.scanEnabled;
                metadata.inputConfig.dirEnabled = urlParamService.isDirectionEnabled() ? true : metadata.inputConfig.dirEnabled;
                metadata.inputConfig.huffEnabled = urlParamService.isHuffmanEnabled() ? true : metadata.inputConfig.huffEnabled;
                dataService.saveMetadata(metadata).then(() => {
                    if (metadata.locked) {
                        this.setViewPropsLocked();
                    }
                });
                thiz.metadata = metadata;
                return Promise.resolve();
            }).then(() => {
                stateService.setCurrentGrid(thiz.gridData);
                return initGrid(thiz.gridData.id);
            }).then(() => {
                initContextmenu();
                thiz.viewInitialized = true;
                $(document).trigger(constants.EVENT_GRID_LOADED);
                let gridDataObject = new GridData(thiz.gridData);
                if (gridDataObject.hasOutdatedThumbnail() && !thiz.skipThumbnailCheck) {
                    imageUtil.allImagesLoaded().then(() => {
                        imageUtil.getScreenshot("#grid-container").then(screenshot => {
                            let thumbnail = {
                                data: screenshot,
                                hash: gridDataObject.getHash()
                            };
                            thiz.gridData.thumbnail = thumbnail;
                            dataService.saveGrid(thiz.gridData);
                        });
                    })
                }
                thiz.initInputMethods();
                thiz.highlightElements();
            }).catch((e) => {
                if (e) {
                    log.warn(e);
                }
            });
        }
    };

    function stopInputMethods() {
        if (vueApp && vueApp.scanner) vueApp.scanner.destroy();
        if (vueApp && vueApp.hover) vueApp.hover.destroy();
        if (vueApp && vueApp.clicker) vueApp.clicker.destroy();
        if (vueApp && vueApp.directionInput) vueApp.directionInput.destroy();
        if (vueApp && vueApp.huffmanInput) vueApp.huffmanInput.destroy();
        if (vueApp && vueApp.seqInput) vueApp.seqInput.destroy();
    }

    function initGrid(gridId) {
        gridInstance = new Grid('#grid-container', '.grid-item-content', {
            enableResizing: false,
            dragAndDrop: false,
            gridId: gridId,
            globalGridHeightPercentage: vueApp.metadata.globalGridHeightPercentage
        });
        printService.setGridInstance(gridInstance);
        return gridInstance.getInitPromise();
    }

    function initContextmenu() {
        $.contextMenu('destroy');
        let CONTEXT_MOUSE = "CONTEXT_MOUSE";
        let CONTEXT_SCANNING = "CONTEXT_SCANNING";
        let CONTEXT_DIRECTION = "CONTEXT_DIRECTION";
        let CONTEXT_HUFFMAN = "CONTEXT_HUFFMAN";
        let CONTEXT_SEQUENTIAL = "CONTEXT_SEQUENTIAL";

        function getName(i18nKey, isActive) {
            let translated = i18nService.t(i18nKey);
            let activeText = isActive ? ' ' + i18nService.t('activeBracket') : '';
            return `${translated}${activeText}`;
        }

        let inputConfig = vueApp.metadata.inputConfig;
        let mouseTouchEnabled = inputConfig.mouseclickEnabled || inputConfig.hoverEnabled;
        let contextItems = {
            CONTEXT_MOUSE: {
                name: getName('mousetouchInput', mouseTouchEnabled),
                icon: "fas fa-mouse-pointer",
                className: mouseTouchEnabled ? 'boldFont' : ''
            },
            CONTEXT_SCANNING: {
                name: getName('scanning', inputConfig.scanEnabled),
                icon: "fas fa-sort-amount-down",
                className: inputConfig.scanEnabled ? 'boldFont' : ''
            },
            CONTEXT_DIRECTION: {
                name: getName('directionInput', inputConfig.dirEnabled),
                icon: "fas fa-arrows-alt",
                className: inputConfig.dirEnabled ? 'boldFont' : ''
            },
            CONTEXT_HUFFMAN: {
                name: getName('huffmanInput', inputConfig.huffEnabled),
                icon: "fas fa-ellipsis-h",
                className: inputConfig.huffEnabled ? 'boldFont' : ''
            },
            CONTEXT_SEQUENTIAL: {
                name: getName('sequentialInput', inputConfig.seqEnabled),
                icon: "fas fa-arrow-right",
                className: inputConfig.seqEnabled ? 'boldFont' : ''
            }
        };

        $.contextMenu({
            selector: '#inputConfigButton',
            appendTo: '#inputConfigMenu',
            callback: function (key, options) {
                handleContextMenu(key);
            },
            trigger: 'left',
            items: contextItems,
            zIndex: 10
        });

        function handleContextMenu(key, elementId) {
            switch (key) {
                case CONTEXT_MOUSE: {
                    vueApp.openModal(modalTypes.MODAL_MOUSE);
                    break;
                }
                case CONTEXT_SCANNING: {
                    vueApp.openModal(modalTypes.MODAL_SCANNING);
                    break;
                }
                case CONTEXT_DIRECTION: {
                    vueApp.setModal("DirectionInputModal");
                    vueApp.$nextTick(() => {
                        vueApp.$refs.modal.openModal();
                    });
                    break;
                }
                case CONTEXT_HUFFMAN: {
                    vueApp.setModal("HuffmanInputModal");
                    vueApp.$nextTick(() => {
                        vueApp.$refs.modal.openModal();
                    });
                    break;
                }
                case CONTEXT_SEQUENTIAL: {
                    vueApp.openModal(modalTypes.MODAL_SEQUENTIAL);
                    break;
                }
            }
        }
    }

    export default vueConfig;
</script>

<style scoped>
#grid-container {
    -webkit-touch-callout: none;
}
</style>
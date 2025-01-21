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
        <div class="srow content text-content" v-show="!renderGridData">
            <div class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin" style="position: relative;"/>
            </div>
        </div>

        <huffman-input-modal v-if="showModal === modalTypes.MODAL_HUFFMAN" @close="showModal = null; reloadInputMethods();" />
        <direction-input-modal v-if="showModal === modalTypes.MODAL_DIRECTION" @close="showModal = null; reloadInputMethods();"/>
        <mouse-modal v-if="showModal === modalTypes.MODAL_MOUSE" @close="showModal = null; reloadInputMethods();"/>
        <scanning-modal v-if="showModal === modalTypes.MODAL_SCANNING" @close="showModal = null; reloadInputMethods();"/>
        <sequential-input-modal v-if="showModal === modalTypes.MODAL_SEQUENTIAL" @close="showModal = null; reloadInputMethods();"/>
        <unlock-modal v-if="showModal === modalTypes.MODAL_UNLOCK" @unlock="unlock(true)" @close="showModal = null;"/>

        <div class="srow content spaced" v-if="renderGridData && renderGridData.gridElements.length === 0">
            <div style="margin-top: 2em">
                <i18n path="noElementsClickToEnterEdit" tag="span">
                    <template v-slot:link>
                        <a :href="'#grid/edit/' + renderGridData.id">{{ $t('editingOn') }}</a>
                    </template>
                </i18n>
            </div>
        </div>
        <div class="srow content d-flex" v-if="renderGridData && renderGridData.gridElements.length > 0">
            <app-grid-display id="grid-container" :grid-data="renderGridData" :metadata="metadata"/>
        </div>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import {L} from "../../js/util/lquery.js";
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
    import {i18nService} from "../../js/service/i18nService";
    import {util} from "../../js/util/util";
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
    import {MainVue} from "../../js/vue/mainVue.js";
    import {stateService} from "../../js/service/stateService.js";
    import { systemActionService } from '../../js/service/systemActionService';
    import AppGridDisplay from '../grid-display/appGridDisplay.vue';
    import { gridUtil } from '../../js/util/gridUtil';
    import { collectElementService } from '../../js/service/collectElementService';
    import { predictionService } from '../../js/service/predictionService';

    let vueApp = null;
    let UNLOCK_COUNT = 8;
    let modalTypes = {
        MODAL_SCANNING: 'MODAL_SCANNING',
        MODAL_MOUSE: 'MODAL_MOUSE',
        MODAL_DIRECTION: 'MODAL_DIRECTION',
        MODAL_HUFFMAN: 'MODAL_HUFFMAN',
        MODAL_SEQUENTIAL: 'MODAL_SEQUENTIAL',
        MODAL_UNLOCK: 'MODAL_UNLOCK'
    };

    let vueConfig = {
        props: {
            gridId: String,
            skipThumbnailCheck: Boolean
        },
        data() {
            return {
                globalGridData: null,
                renderGridData: null,
                metadata: null,
                updatedMetadataDoc: null,
                scanner: null,
                hover: null,
                clicker: null,
                directionInput: null,
                seqInput: null,
                huffmanInput: null,
                inputMethodsInitialized: false,
                showModal: null,
                modalTypes: modalTypes,
                unlockCount: UNLOCK_COUNT,
                unlockCounter: UNLOCK_COUNT,
                MainVue: MainVue,
                highlightTimeoutHandler: null,
                highlightedElementId: null,
                systemActionService: systemActionService
            }
        },
        components: {
            AppGridDisplay,
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
            reloadInputMethods() {
                this.initInputMethods({reload: true});
            },
            async initInputMethods(options = {}) {
                options.continueInputMethods = options.continueInputMethods || false;
                options.reload = options.reload || false;
                if (this.inputMethodsInitialized) {
                    stopInputMethods();
                }
                if (options.reload) {
                    let metadata = await dataService.getMetadata();
                    this.metadata = JSON.parse(JSON.stringify(metadata));
                    initContextmenu(); //in order to update visualization of active input methods in context menu
                }
                let thiz = this;
                let inputConfig = thiz.metadata.inputConfig;
                let selectionListener = (item) => {
                    this.stopHighlightElements();
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(thiz.renderGridData, item.id);
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
                        itemSelector: '.element-container:not([data-empty="true"])',
                        selectionListener: selectionListener,
                        activeListener: activeListener
                    });
                    thiz.seqInput.start(options.continueInputMethods);
                }

                if (inputConfig.dirEnabled) {
                    thiz.directionInput = DirectionInput.getInstanceFromConfig(inputConfig, '.element-container:not([data-empty="true"])', 'scanFocus', selectionListener);
                    thiz.directionInput.start();
                }

                if (inputConfig.huffEnabled) {
                    this.huffmanInput = HuffmanInput.getInstanceFromConfig(inputConfig, '.element-container', 'scanFocus', 'scanInactive', selectionListener);
                    this.huffmanInput.start();
                }

                if (inputConfig.scanEnabled) {
                    thiz.scanner = Scanner.getInstanceFromConfig(inputConfig, '.element-container:not([data-empty="true"])', 'scanFocus', 'scanInactive');
                    thiz.scanner.setSelectionListener(selectionListener);
                    thiz.scanner.setActiveListener(activeListener);
                    thiz.scanner.startScanning(options.continueInputMethods);
                }

                if (inputConfig.hoverEnabled) {
                    thiz.hover = Hover.getInstanceFromConfig(inputConfig, '.element-container', {
                        activeListener: activeListener,
                        containerClass: '.grid-container li'
                    });
                    thiz.hover.setSelectionListener(selectionListener);
                    thiz.hover.startHovering();
                } else {
                    $('#touchElement').hide();
                }

                if (inputConfig.mouseclickEnabled || inputConfig.mouseDoubleClickEnabled) {
                    thiz.clicker = Clicker.getInstanceFromConfig(inputConfig, '.element-container');
                    thiz.clicker.setSelectionListener(selectionListener);
                    thiz.clicker.startClickcontrol();
                }
                this.inputMethodsInitialized = true;
            },
            async onNavigateEvent(event, gridData, params) {
                await this.loadGrid(gridData, { continueInputMethods: true });
            },
            async loadGrid(gridData, options = {}) {
                options.continueInputMethods = options.continueInputMethods || false;
                options.forceReload = options.forceReload || false;
                collectElementService.clearCollectElements();
                if (gridData && (options.forceReload || !this.renderGridData || this.renderGridData.id !== gridData.id)) {
                    if (gridUtil.hasAREModel(gridData)) {
                        let areModel = gridUtil.getAREModel(gridData);
                        areService.uploadAndStartModel(areModel.dataBase64, gridUtil.getAREURL(gridData), areModel.fileName);
                    }

                    // these two lines before recalculateRenderGrid since it changes gridData!
                    let updateThumbnail = gridUtil.hasOutdatedThumbnail(gridData) && !this.skipThumbnailCheck;
                    let newHash = updateThumbnail ? gridUtil.getHash(gridData) : null;

                    await this.recalculateRenderGrid(gridData);
                    Router.addToGridHistory(this.renderGridData.id);

                    if (updateThumbnail) {
                        imageUtil.allImagesLoaded().then(async () => {
                            let screenshot = await imageUtil.getScreenshot("#grid-container");
                            let thumbnail = {
                                data: screenshot,
                                hash: newHash
                            };
                            dataService.saveThumbnail(this.renderGridData.id, thumbnail);
                        })
                    }

                    if (this.metadata.lastOpenedGridId !== gridData.id) {
                        this.metadata.lastOpenedGridId = gridData.id;
                        await dataService.saveMetadata(this.metadata);
                    }
                }

                await this.$nextTick();
                initContextmenu();
                this.initInputMethods(options);
                this.highlightElements();
                await predictionService.initWithElements(this.renderGridData.gridElements);
                collectElementService.initWithElements(this.renderGridData.gridElements);
                $(document).trigger(constants.EVENT_GRID_LOADED);
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
            toEditGrid() {
                Router.toEditGrid(this.renderGridData.id);
            },
            toLogin() {
                Router.toLogin();
            },
            async onExternalUpdate(event, updatedIds, updatedDocs, deletedIds) {
                let thiz = this;
                if (!vueApp) {
                    setTimeout(() => {
                        thiz.onExternalUpdate(event, updatedIds, updatedDocs);
                    }, 500);
                    return;
                }
                if (deletedIds.includes(vueApp.gridId)) {
                    Router.toManageGrids();
                    return;
                }
                log.debug('got update event, ids updated:' + updatedIds);
                let updatedGridDoc = updatedDocs.filter(doc => (vueApp.renderGridData && doc.id === vueApp.renderGridData.id))[0];
                let hasUpdatedGlobalGrid = updatedDocs.filter(doc => (this.metadata && doc.id === this.metadata.globalGridId)).length > 0;
                this.updatedMetadataDoc = updatedDocs.filter(doc => (vueApp.metadata && doc.id === vueApp.metadata.id))[0] || this.updatedMetadataDoc;
                if (updatedGridDoc) {
                    vueApp.loadGrid(updatedGridDoc, { continueInputMethods: true, forceReload: true });
                } else if (hasUpdatedGlobalGrid) {
                    let gridData = await dataService.getGrid(vueApp.renderGridData.id, false, true);
                    this.globalGridData = await dataService.getGlobalGrid();
                    vueApp.loadGrid(gridData, { continueInputMethods: true, forceReload: true });
                }
                if (localStorageService.getAppSettings().syncNavigation) {
                    if (this.updatedMetadataDoc && this.updatedMetadataDoc.lastOpenedGridId !== vueApp.renderGridData.id) {
                        dataService.getGrid(this.updatedMetadataDoc.lastOpenedGridId).then(toGrid => {
                            if (!gridUtil.hasOutdatedThumbnail(toGrid)) {
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
                }
                this.metadata = this.updatedMetadataDoc || this.metadata;
            },
            async recalculateRenderGrid(gridData) {
                // attention: gridData also changes because of "noDeepCopy: true"
                // just using this.renderGridData for clarity
                if (gridData.showGlobalGrid) {
                    let globalGrid = this.globalGridData;
                    if (gridData.globalGridId) {
                        globalGrid = await dataService.getGrid(gridData.globalGridId, false, true);
                    }
                    this.renderGridData = gridUtil.mergeGrids(gridData, globalGrid, {
                        globalGridHeightPercentage: this.metadata.globalGridHeightPercentage,
                        noDeepCopy: true
                    });
                } else {
                    this.renderGridData = gridData;
                }
                this.renderGridData.gridElements = this.renderGridData.gridElements.filter(e => !e.hidden);
                stateService.setCurrentGrid(this.renderGridData);
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
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.onExternalUpdate);
            $(document).on(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
            $(document).on(constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE, this.onNavigateEvent);
            document.addEventListener('contextmenu', this.contextMenuListener);
            window.addEventListener('resize', this.resizeListener, true);
            $(document).on(constants.EVENT_GRID_RESIZE, this.resizeListener);
            $(document).on(constants.EVENT_METADATA_UPDATED, this.metadataUpdated);
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.onExternalUpdate);
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
        },
        mounted: async function () {
            vueApp = this;

            let savedMetadata = await dataService.getMetadata();
            let metadata = JSON.parse(JSON.stringify(savedMetadata || new MetaData()));
            metadata.lastOpenedGridId = this.gridId;
            metadata.locked = metadata.locked === undefined ? urlParamService.isDemoMode() && dataService.getCurrentUser() === constants.LOCAL_DEMO_USERNAME : metadata.locked;
            if (metadata.locked) {
                $(document).trigger(constants.EVENT_UI_LOCKED);
            }
            metadata.fullscreen = metadata.fullscreen === undefined ? urlParamService.isDemoMode() && dataService.getCurrentUser() === constants.LOCAL_DEMO_USERNAME : metadata.fullscreen;
            metadata.fullscreen = urlParamService.isFullscreen(true) ? true : metadata.fullscreen;
            metadata.locked = urlParamService.isLocked(true) ? true : metadata.locked;
            metadata.inputConfig.scanEnabled = urlParamService.isScanningEnabled() ? true : metadata.inputConfig.scanEnabled;
            metadata.inputConfig.dirEnabled = urlParamService.isDirectionEnabled() ? true : metadata.inputConfig.dirEnabled;
            metadata.inputConfig.huffEnabled = urlParamService.isHuffmanEnabled() ? true : metadata.inputConfig.huffEnabled;
            dataService.saveMetadata(metadata).then(() => {
                if (metadata.locked) {
                    this.setViewPropsLocked();
                }
            });
            this.metadata = metadata;
            this.globalGridData = await dataService.getGlobalGrid();
            let gridData = await dataService.getGrid(this.gridId, false, true);
            if (!gridData) {
                log.warn('grid not found! gridId: ' + this.gridId);
                let grids = await dataService.getGrids(false, true);
                if (grids && grids[0]) {
                    gridData = await dataService.getGrid(grids[0].id);
                } else {
                    return Router.toManageGrids();
                }
            }
            this.loadGrid(gridData);
        }
    };

    function stopInputMethods() {
        if (!vueApp) {
            return;
        }
        if (vueApp.scanner) vueApp.scanner.destroy();
        if (vueApp.hover) vueApp.hover.destroy();
        if (vueApp.clicker) vueApp.clicker.destroy();
        if (vueApp.directionInput) vueApp.directionInput.destroy();
        if (vueApp.huffmanInput) vueApp.huffmanInput.destroy();
        if (vueApp.seqInput) vueApp.seqInput.destroy();
        vueApp.inputMethodsInitialized = false;
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
                    vueApp.openModal(modalTypes.MODAL_DIRECTION);
                    break;
                }
                case CONTEXT_HUFFMAN: {
                    vueApp.openModal(modalTypes.MODAL_HUFFMAN);
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
</style>
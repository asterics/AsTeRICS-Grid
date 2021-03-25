<template>
    <div class="box" v-cloak>
        <header class="row header" role="banner" v-if="metadata && !metadata.fullscreen">
            <header-icon class="left" v-show="!metadata.locked"></header-icon>
            <div class="btn-group left">
                <button tabindex="30" v-show="!metadata.locked" @click="toEditGrid()" class="spaced small"><i class="fas fa-pencil-alt"/> <span class="hide-mobile" data-i18n>Editing on // Bearbeiten ein</span></button>
                <button tabindex="31" id="inputConfigButton" v-show="!metadata.locked" class="small"><i class="fas fa-cog"></i> <span class="hide-mobile" data-i18n>Input options // Eingabeoptionen</span></button>
            </div>
            <button tabindex="34" v-show="metadata.locked" @click="unlock()" class="small">
                <i class="fas fa-unlock"></i>
                <span class="hide-mobile" data-i18n>Unlock // Entsperren</span>
                <span v-if="unlockCounter !== unlockCount">{{unlockCounter}}</span>
            </button>
            <button tabindex="33" v-show="!metadata.locked" @click="lock()" class="small">
                <i class="fas fa-lock"></i>
                <span class="hide-mobile" data-i18n>Lock // Sperren</span>
            </button>
            <button tabindex="32" @click="applyFullscreen()" class="spaced small"><i class="fas fa-expand"/> <span class="hide-mobile" data-i18n>Fullscreen // Vollbild</span></button>

        </header>

        <huffman-input-modal v-if="showModal === modalTypes.MODAL_HUFFMAN" @close="showModal = null; reinitInputMethods();"/>
        <direction-input-modal v-if="showModal === modalTypes.MODAL_DIRECTION" @close="showModal = null; reinitInputMethods();"/>
        <mouse-modal v-if="showModal === modalTypes.MODAL_MOUSE" @close="showModal = null; reinitInputMethods();"/>
        <scanning-modal v-if="showModal === modalTypes.MODAL_SCANNING" @close="showModal = null; reinitInputMethods();"/>
        <sequential-input-modal v-if="showModal === modalTypes.MODAL_SEQUENTIAL" @close="showModal = null; reinitInputMethods();"/>
        <unlock-modal v-if="showModal === modalTypes.MODAL_UNLOCK" @unlock="unlock(true)" @close="showModal = null;"/>

        <div class="row content spaced" v-show="viewInitialized && gridData.gridElements && gridData.gridElements.length === 0 && (!globalGridData || globalGridData.length === 0)">
            <div data-i18n="" style="margin-top: 2em">
                <span>No elements, click <a :href="'#grid/edit/' + gridId">Edit grid</a> to enter edit mode.</span>
                <span>Keine Elemente, klicke auf <a :href="'#grid/edit/' + gridId">Grid bearbeiten</a> um das Grid zu bearbeiten.</span>
            </div>
        </div>
        <div class="row content">
            <div v-if="!viewInitialized" class="grid-container grid-mask">
                <i class="fas fa-4x fa-spinner fa-spin"/>
            </div>
            <div id="grid-container" class="grid-container">
            </div>
        </div>
    </div>
</template>

<script>
    import $ from 'jquery';
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
    import ScanningModal from '../../vue-components/modals/input/scanningModal.vue'
    import MouseModal from "../modals/input/mouseModal.vue";
    import DirectionInputModal from "../modals/input/directionInputModal.vue";
    import HuffmanInputModal from "../modals/input/huffmanInputModal.vue";
    import SequentialInputModal from "../modals/input/sequentialInputModal.vue";
    import {speechService} from "../../js/service/speechService";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {imageUtil} from "../../js/util/imageUtil";
    import UnlockModal from "../modals/unlockModal.vue";
    import {printService} from "../../js/service/printService";

    let vueApp = null;
    let gridInstance = null;
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
        props: ['gridId'],
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
                unlockCounter: UNLOCK_COUNT
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
                    $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                });
            },
            unlock(force) {
                let thiz = this;
                if (!force && localStorageService.getUnlockPasscode()) {
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
                        $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
                    });
                }
            },
            applyFullscreen(dontSave) {
                util.openFullscreen();
                this.metadata.fullscreen = true;
                let promise = Promise.resolve();
                if (!dontSave) {
                    promise = dataService.saveMetadata(this.metadata);
                }
                promise.then(() => {
                    $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                });
            },
            initInputMethods() {
                let thiz = this;
                if (!gridInstance) {
                    return;
                }

                let inputConfig = thiz.metadata.inputConfig;
                window.addEventListener('resize', thiz.resizeListener, true);
                $(document).on(constants.EVENT_GRID_RESIZE, thiz.resizeListener);
                let selectionListener = (item) => {
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(thiz.gridData.id, item.id);
                };
                let activeListener = (item) => {
                    if (inputConfig.globalReadActive) {
                        speechService.speakLabel(thiz.gridData.id, item.id);
                    }
                };

                if (inputConfig.seqEnabled) {
                    thiz.seqInput = SequentialInput.getInstanceFromConfig(inputConfig, '.grid-item-content:not([data-empty="true"])', {
                        selectionListener: selectionListener,
                        activeListener: activeListener
                    });
                    thiz.seqInput.start();
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

                    gridInstance.setLayoutChangedStartListener(function () {
                        thiz.scanner.pauseScanning();
                    });
                    gridInstance.setLayoutChangedEndListener(function () {
                        thiz.scanner.resumeScanning();
                    });

                    thiz.scanner.startScanning();
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

                if (inputConfig.mouseclickEnabled) {
                    thiz.clicker = new Clicker('.grid-item-content');
                    thiz.clicker.setSelectionListener(selectionListener);
                    thiz.clicker.startClickcontrol();
                }
            },
            reinitInputMethods() {
                let thiz = this;
                stopInputMethods();
                dataService.getMetadata().then(newMetadata => {
                    thiz.metadata = JSON.parse(JSON.stringify(newMetadata));
                    initContextmenu(); //in order to update visualization of active input methods in context menu
                    thiz.initInputMethods();
                });
            },
            reload(gridData) {
                gridInstance.reinit(gridData).then(() => {
                    if (gridData) {
                        this.gridData = JSON.parse(JSON.stringify(gridData));
                    }
                    this.reinitInputMethods();
                });
            },
            reloadOnLangChange() {
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
            reloadFn(event, updatedIds, updatedDocs) {
                let thiz = this;
                if (!vueApp || !gridInstance || !gridInstance.isInitialized()) {
                    setTimeout(() => {
                        thiz.reloadFn(event, updatedIds, updatedDocs);
                    }, 500);
                    return;
                }
                log.debug('got update event, ids updated:' + updatedIds);
                let updatedGridDoc = updatedDocs.filter(doc => (vueApp.gridData && doc.id === vueApp.gridData.id))[0];
                this.updatedMetadataDoc = updatedDocs.filter(doc => (vueApp.metadata && doc.id === vueApp.metadata.id))[0] || this.updatedMetadataDoc;
                if (updatedGridDoc) {
                    vueApp.reload(new GridData(updatedGridDoc));
                }
                if (!localStorageService.shouldSyncNavigation()) {
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
                        vueApp.applyFullscreen(true);
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
            }
        },
        computed: {
            filteredGrids: function () {
                return []
            },
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            $(document).on(constants.EVENT_LANGUAGE_CHANGE, this.reloadOnLangChange);
            $(document).on(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
            document.addEventListener('contextmenu', this.contextMenuListener);
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            dataService.getGlobalGrid().then(globalGrid => {
                thiz.globalGridData = globalGrid;
                return dataService.getGrid(thiz.gridId);
            }).then(gridData => {
                if (!gridData) {
                    log.warn('grid not found! gridId: ' + this.gridId);
                    return dataService.getGrids(false, true).then(grids => {
                        if (grids[0]) {
                            Router.toGrid(grids[0].id);
                        } else {
                            Router.toManageGrids();
                        }
                        return Promise.reject();
                    });
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
                metadata.lastOpenedGridId = this.gridId;
                metadata.locked = metadata.locked === undefined ? urlParamService.isDemoMode() && dataService.getCurrentUser() === constants.LOCAL_DEMO_USERNAME : metadata.locked;
                metadata.fullscreen = metadata.fullscreen === undefined ? urlParamService.isDemoMode() && dataService.getCurrentUser() === constants.LOCAL_DEMO_USERNAME : metadata.fullscreen;
                metadata.inputConfig.scanEnabled = urlParamService.isScanningEnabled() ? true : metadata.inputConfig.scanEnabled;
                metadata.inputConfig.dirEnabled = urlParamService.isDirectionEnabled() ? true : metadata.inputConfig.dirEnabled;
                metadata.inputConfig.huffEnabled = urlParamService.isHuffmanEnabled() ? true : metadata.inputConfig.huffEnabled;
                dataService.saveMetadata(metadata).then(() => {
                    if (metadata.locked) {
                        $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                    }
                });
                thiz.metadata = metadata;
                return Promise.resolve();
            }).then(() => {
                return initGrid(thiz.gridData.id);
            }).then(() => {
                initContextmenu();
                thiz.viewInitialized = true;
                $(document).trigger(constants.EVENT_GRID_LOADED);
                let gridDataObject = new GridData(thiz.gridData);
                if (gridDataObject.hasOutdatedThumbnail()) {
                    imageUtil.getScreenshot("#grid-container").then(screenshot => {
                        let thumbnail = {
                            data: screenshot,
                            hash: gridDataObject.getHash()
                        };
                        thiz.gridData.thumbnail = thumbnail;
                        dataService.saveGrid(thiz.gridData);
                    });
                }
                thiz.initInputMethods();
            }).catch((e) => {
                if (e) {
                    log.warn(e);
                }
            });
        },
        updated() {
            i18nService.initDomI18n();
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            $(document).off(constants.EVENT_LANGUAGE_CHANGE, this.reloadOnLangChange);
            $(document).off(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
            document.removeEventListener('contextmenu', this.contextMenuListener);
            stopInputMethods();
            $.contextMenu('destroy');
            vueApp = null;
            if (gridInstance) {
                gridInstance.destroy();
                gridInstance = null;
                printService.setGridInstance(null);
            }
        }
    };

    function stopInputMethods() {
        if (vueApp) window.removeEventListener('resize', vueApp.resizeListener, true);
        if (vueApp) $(document).off(constants.EVENT_GRID_RESIZE, vueApp.resizeListener);
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

        function getActiveText(isActive, german) {
            let text = german ? ' (aktiv)' : ' (active)'
            return isActive ? text : ''
        }

        function getName(english, german, isActive) {
            return `${english}${getActiveText(isActive)} // ${german}${getActiveText(isActive, true)}`;
        }

        let inputConfig = vueApp.metadata.inputConfig;
        let mouseTouchEnabled = inputConfig.mouseclickEnabled || inputConfig.hoverEnabled;
        let contextItems = {
            CONTEXT_MOUSE: {
                name: getName('Mouse/Touch input', 'Maus-/Toucheingabe', mouseTouchEnabled),
                icon: "fas fa-mouse-pointer",
                className: mouseTouchEnabled ? 'boldFont' : ''
            },
            CONTEXT_SCANNING: {
                name: getName('Scanning', 'Scanning', inputConfig.scanEnabled),
                icon: "fas fa-sort-amount-down",
                className: inputConfig.scanEnabled ? 'boldFont' : ''
            },
            CONTEXT_DIRECTION: {
                name: getName('Direction input', 'Richtungs-Eingabe', inputConfig.dirEnabled),
                icon: "fas fa-arrows-alt",
                className: inputConfig.dirEnabled ? 'boldFont' : ''
            },
            CONTEXT_HUFFMAN: {
                name: getName('Huffman input', 'Huffman-Eingabe', inputConfig.huffEnabled),
                icon: "fas fa-ellipsis-h",
                className: inputConfig.huffEnabled ? 'boldFont' : ''
            },
            CONTEXT_SEQUENTIAL: {
                name: getName('Sequential input', 'Sequentielle Eingabe', inputConfig.seqEnabled),
                icon: "fas fa-arrow-right",
                className: inputConfig.seqEnabled ? 'boldFont' : ''
            }
        };

        $.contextMenu({
            selector: '#inputConfigButton',
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
<template>
    <div class="box" v-cloak>
        <header class="row header" role="banner" v-if="metadata && !metadata.fullscreen">
            <header-icon v-show="!metadata.locked"></header-icon>
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
            <button tabindex="31" v-show="!metadata.locked" @click="toEditGrid()" class="spaced small"><i class="fas fa-pencil-alt"/> <span class="hide-mobile" data-i18n>Edit grid // Grid bearbeiten</span></button>
            <button tabindex="30" v-show="!metadata.locked" @click="openModal(modalTypes.MODAL_SCANNING)" class="small"><i class="fas fa-cog"></i> <span class="hide-mobile" data-i18n>Input options // Eingabeoptionen</span></button>
        </header>

        <scanning-modal v-if="showModal === modalTypes.MODAL_SCANNING" @close="showModal = null; reinitInputMethods();"/>
        <div class="row content spaced" v-show="viewInitialized && gridData.gridElements && gridData.gridElements.length === 0">
            <div data-i18n="" style="margin-top: 2em">
                <span>No elements, click <a :href="'#grid/edit/' + gridData.id">Edit grid</a> to enter edit mode.</span>
                <span>Keine Elemente, klicke auf <a :href="'#grid/edit/' + gridData.id">Grid bearbeiten</a> um das Grid zu bearbeiten.</span>
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

    import ScanningModal from '../../vue-components/modals/input/scanningModal.vue'
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {constants} from "../../js/util/constants";
    import {GridData} from "../../js/model/GridData";
    import {i18nService} from "../../js/service/i18nService";
    import {util} from "../../js/util/util";
    import {HuffmanInput} from "../../js/input/huffmanInput";
    import {DirectionInput} from "../../js/input/directionInput";
    import {InputEventKey} from "../../js/model/InputEventKey";
    import {InputConfig} from "../../js/model/InputConfig";

    let vueApp = null;
    let gridInstance = null;
    let UNLOCK_COUNT = 8;
    let modalTypes = {
        MODAL_SCANNING: 'MODAL_SCANNING',
        MODAL_MOUSE: 'MODAL_MOUSE',
        MODAL_DIRECTION: 'MODAL_DIRECTION',
        MODAL_HUFFMAN: 'MODAL_HUFFMAN',
    };

    let vueConfig = {
        props: ['gridId'],
        data() {
            return {
                gridData: {},
                metadata: null,
                scanner: null,
                hover: null,
                clicker: null,
                directionInput: null,
                huffmanInput: null,
                showModal: null,
                modalTypes: modalTypes,
                viewInitialized: false,
                unlockCount: UNLOCK_COUNT,
                unlockCounter: UNLOCK_COUNT
            }
        },
        components: {
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
                this.metadata.fullscreen = true;
                if (!dontSave) {
                    dataService.saveMetadata(this.metadata);
                }
                $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
            },
            initInputMethods() {
                let thiz = this;
                if (!gridInstance) {
                    return;
                }

                let inputConfig = thiz.metadata.inputConfig;
                window.addEventListener('resize', thiz.resizeListener, true);
                $(document).on(constants.EVENT_GRID_RESIZE, thiz.resizeListener);
                if (inputConfig.dirEnabled) { //TODO remove true
                    thiz.directionInput = new DirectionInput('.grid-item-content', 'scanFocus', {
                        inputEventLeft: inputConfig.dirInputs[InputConfig.LEFT] || new InputEventKey({keyCode: 37}), //TODO: remove second part
                        inputEventRight: inputConfig.dirInputs[InputConfig.RIGHT] || new InputEventKey({keyCode: 39}), //TODO: remove second part
                        inputEventUp: inputConfig.dirInputs[InputConfig.UP] || new InputEventKey({keyCode: 38}), //TODO: remove second part
                        inputEventDown: inputConfig.dirInputs[InputConfig.DOWN] || new InputEventKey({keyCode: 40}), //TODO: remove second part
                        inputEventSelect: inputConfig.dirInputs[InputConfig.SELECT] || new InputEventKey({keyCode: 32}), //TODO: remove second part
                        wrapAround: true,
                        selectionListener: function (item) {
                            actionService.doAction(gridInstance.getCurrentGridId(), item.id);
                        }
                    });
                    thiz.directionInput.start();
                }

                if (inputConfig.huffEnabled || true) { //TODO remove true
                    this.huffmanInput = new HuffmanInput('.grid-item-content', 'scanFocus', {
                        printCodes: true,
                        printColors: true,
                        colors: inputConfig.huffColors,
                        inputEvents: [new InputEventKey({keyCode: 49}), new InputEventKey({keyCode: 50}), new InputEventKey({keyCode: 51}), new InputEventKey({keyCode: 52}), new InputEventKey({keyCode: 53}), new InputEventKey({keyCode: 54})], // TODO use inputConfig.huffInputs
                        selectionListener: function (item) {
                            actionService.doAction(gridInstance.getCurrentGridId(), item.id);
                        }
                    });
                    this.huffmanInput.start();
                }

                if (inputConfig.scanEnabled || inputConfig.scanAutostart) { //TODO remove true
                    thiz.scanner = Scanner.getInstanceFromConfig(inputConfig, '.grid-item-content', 'scanFocus', 'scanInactive');
                    thiz.scanner.setSelectionListener(function (item) {
                        L.removeAddClass(item, 'selected');
                        actionService.doAction(gridInstance.getCurrentGridId(), item.id);
                    });

                    gridInstance.setLayoutChangedStartListener(function () {
                        thiz.scanner.pauseScanning();
                    });
                    gridInstance.setLayoutChangedEndListener(function () {
                        thiz.scanner.resumeScanning();
                    });

                    thiz.scanner.startScanning();

                    if (inputConfig.areURL && inputConfig.areEvents.length > 0) {
                        let lastSelect = 0;
                        areService.subscribeEvents(function (eventString) { //TODO remove
                            if (inputConfig.areEvents.includes(eventString)) {
                                if (new Date().getTime() - lastSelect > 100) {
                                    log.info('select scanning per ARE event: ' + eventString);
                                    lastSelect = new Date().getTime();
                                    thiz.scanner.select();
                                }
                            }
                        }, inputConfig.areURL);
                    } else {
                        areService.unsubscribeEvents();
                    }
                }

                if (inputConfig.hoverEnabled) {
                    thiz.hover = new Hover('.grid-item-content', inputConfig.hoverTimeoutMs);
                    thiz.hover.setSelectionListener(function (item) {
                        L.removeAddClass(item, 'selected');
                        actionService.doAction(thiz.gridData.id, item.id);
                    });
                    thiz.hover.startHovering();
                }

                if (inputConfig.mouseclickEnabled) {
                    thiz.clicker = new Clicker('.grid-item-content');
                    thiz.clicker.setSelectionListener(function (item) {
                        L.removeAddClass(item, 'selected');
                        actionService.doAction(thiz.gridData.id, item.id);
                    });
                    thiz.clicker.startClickcontrol();
                }
            },
            reinitInputMethods() {
                let thiz = this;
                stopInputMethods();
                dataService.getMetadata().then(newMetadata => {
                    thiz.metadata = JSON.parse(JSON.stringify(newMetadata));
                    thiz.initInputMethods();
                });
            },
            reload(gridData) {
                gridInstance.reinit(gridData);
                if (gridData) {
                    this.gridData = JSON.parse(JSON.stringify(gridData));
                }
                this.reinitInputMethods();
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
                let updatedMetadataDoc = updatedDocs.filter(doc => (vueApp.metadata && doc.id === vueApp.metadata.id))[0];
                if (updatedGridDoc) {
                    vueApp.reload(new GridData(updatedGridDoc));
                }
                if (updatedMetadataDoc && updatedMetadataDoc.lastOpenedGridId !== vueApp.gridData.id) {
                    Router.toLastOpenedGrid();
                    return;
                }
                if (updatedMetadataDoc && updatedMetadataDoc.fullscreen !== vueApp.metadata.fullscreen) {
                    vueApp.metadata.fullscreen = updatedMetadataDoc.fullscreen;
                    if (updatedMetadataDoc.fullscreen) {
                        vueApp.applyFullscreen(true);
                    } else {
                        $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
                    }
                }
                if (updatedMetadataDoc && updatedMetadataDoc.locked !== vueApp.metadata.locked) {
                    if (updatedMetadataDoc.locked) {
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
            }
        },
        computed: {
            filteredGrids: function () {
                return []
            },
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            $(document).on(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            dataService.getGrid(thiz.gridId).then(gridData => {
                if (!gridData) {
                    throw 'grid not found! gridId: ' + this.gridId;
                }
                if (gridData.hasAREModel()) {
                    let areModel = gridData.getAREModel();
                    areService.uploadAndStartModel(areModel.dataBase64, gridData.getAREURL(), areModel.fileName);
                }
                thiz.gridData = JSON.parse(JSON.stringify(gridData));
                return Promise.resolve();
            }).then(() => {
                return dataService.getMetadata();
            }).then((savedMetadata) => {
                let metadata = new MetaData(savedMetadata) || new MetaData();
                metadata.lastOpenedGridId = this.gridId;
                metadata.locked = metadata.locked === undefined ? urlParamService.isDemoMode() : metadata.locked;
                metadata.fullscreen = metadata.fullscreen === undefined ? urlParamService.isDemoMode() : metadata.fullscreen;
                if (urlParamService.isScanningDisabled()) {
                    metadata.inputConfig.scanAutostart = false;
                }
                if (urlParamService.hideHeader()) {
                    metadata.headerPinned = false;
                }
                dataService.saveMetadata(metadata);
                if (metadata.locked) {
                    $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                }
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                return Promise.resolve();
            }).then(() => {
                return initGrid(thiz.gridData.id);
            }).then(() => {
                thiz.viewInitialized = true;
                thiz.initInputMethods();
            }).catch((e) => {
                log.warn(e);
                Router.toManageGrids();
            });
        },
        updated() {
            i18nService.initDomI18n();
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.reloadFn);
            $(document).off(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
            stopInputMethods();
            areService.unsubscribeEvents();
            vueApp = null;
            if (gridInstance) {
                gridInstance.destroy();
                gridInstance = null;
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
    }

    function initGrid(gridId) {
        gridInstance = new Grid('#grid-container', '.grid-item-content', {
            enableResizing: false,
            dragAndDrop: false,
            gridId: gridId
        });
        return gridInstance.getInitPromise();
    }

    export default vueConfig;
</script>

<style scoped>
</style>
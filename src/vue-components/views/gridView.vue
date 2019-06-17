<template>
    <div class="box" v-cloak>
        <header class="row header" role="banner" v-show="!metadata.fullscreen">
            <header-icon v-show="!metadata.locked"></header-icon>
            <button v-show="metadata.locked" @click="toggleLock()" class="small">
                <i class="fas fa-unlock"></i>
                <span class="hide-mobile" data-i18n>Unlock // Entsperren</span>
                <span v-if="unlockCounter !== unlockCount">{{unlockCounter}}</span>
            </button>
            <button v-show="!metadata.locked" @click="toggleLock()" class="small">
                <i class="fas fa-lock"></i>
                <span class="hide-mobile" data-i18n>Lock // Sperren</span>
            </button>
            <button @click="applyFullscreen()" class="spaced small"><i class="fas fa-expand"/> <span class="hide-mobile" data-i18n>Fullscreen // Vollbild</span></button>
            <button v-show="!metadata.locked" @click="toEditGrid()" class="spaced small"><i class="fas fa-pencil-alt"/> <span class="hide-mobile" data-i18n>Edit grid // Grid bearbeiten</span></button>
            <button v-show="!metadata.locked" @click="showModal = true" class="small"><i class="fas fa-cog"></i> <span class="hide-mobile" data-i18n>Input options // Eingabeoptionen</span></button>
        </header>
        <input-options-modal v-if="showModal" v-bind:metadata-property="metadata" v-bind:scanner="scanner" v-bind:hover="hover" v-bind:clicker="clicker" v-bind:reinit="reinitInputMethods" @close="showModal = false"/>
        <div class="row content spaced" v-show="!gridData.gridElements || gridData.gridElements.length == 0">
            <div data-i18n="" style="margin-top: 2em">
                <span>No elements, click <a :href="'#grid/edit/' + gridData.id">Edit grid</a> to enter edit mode.</span>
                <span>Keine Elemente, klicke auf <a :href="'#grid/edit/' + gridData.id">Grid bearbeiten</a> um das Grid zu bearbeiten.</span>
            </div>
        </div>
        <div id="grid-mask" v-if="!showGrid" class="grid-container">
            <i class="fas fa-4x fa-spinner fa-spin"/>
        </div>
        <div class="row content">
            <div id="grid-container" class="grid-container">
            </div>
        </div>
    </div>
</template>

<script>
    import $ from 'jquery';
    import {L} from "../../lib/lquery.js";
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

    import InputOptionsModal from '../../vue-components/modals/inputOptionsModal.vue'
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {constants} from "../../js/util/constants";
    import {GridData} from "../../js/model/GridData";
    import {I18nModule} from "../../js/i18nModule";
    import {util} from "../../js/util/util";

    let vueApp = null;
    let gridInstance = null;
    let UNLOCK_COUNT = 8;

    let vueConfig = {
        props: ['gridId'],
        data() {
            return {
                gridData: {},
                metadata: {},
                scanner: null,
                hover: null,
                clicker: null,
                showModal: false,
                showGrid: false,
                unlockCount: UNLOCK_COUNT,
                unlockCounter: UNLOCK_COUNT
            }
        },
        components: {
            InputOptionsModal, HeaderIcon
        },
        methods: {
            toggleLock() {
                let thiz = this;
                if (thiz.metadata.locked) {
                    thiz.unlockCounter--;
                    util.debounce(function () {
                        thiz.unlockCounter = UNLOCK_COUNT;
                    }, 1500);
                    if (thiz.unlockCounter === 0) {
                        thiz.metadata.locked = false;
                        dataService.saveMetadata(thiz.metadata).then(() => {
                            $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
                        });
                    }
                } else {
                    thiz.metadata.locked = true;
                    thiz.unlockCounter = UNLOCK_COUNT;
                    dataService.saveMetadata(thiz.metadata).then(() => {
                        $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                    });
                }
            },
            applyFullscreen() {
                this.metadata.fullscreen = true;
                dataService.saveMetadata(this.metadata);
                $(document).trigger(constants.EVENT_GRID_RESIZE);
                $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
            },
            initInputMethods() {
                let thiz = this;
                if (!gridInstance) {
                    return;
                }
                let inputConfig = thiz.metadata.inputConfig;
                thiz.scanner = new Scanner('.grid-item-content', 'scanFocus', {
                    scanVertical: inputConfig.scanVertical,
                    subScanRepeat: 3,
                    scanBinary: inputConfig.scanBinary,
                    scanInactiveClass: 'scanInactive',
                    minBinarySplitThreshold: 3,
                    scanTimeoutMs: inputConfig.scanTimeoutMs,
                    scanTimeoutFirstElementFactor: inputConfig.scanTimeoutFirstElementFactor,
                    selectKeyCode: inputConfig.scanKey,
                    touchScanning: !inputConfig.mouseclickEnabled
                });
                if (inputConfig.areURL && inputConfig.areEvents.length > 0) {
                    let lastSelect = 0;
                    areService.subscribeEvents(function (eventString) {
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
                thiz.hover = new Hover('.grid-item-content', inputConfig.hoverTimeoutMs);
                thiz.clicker = new Clicker('.grid-item-content');

                gridInstance.setLayoutChangedStartListener(function () {
                    thiz.scanner.pauseScanning();
                });
                gridInstance.setLayoutChangedEndListener(function () {
                    thiz.scanner.resumeScanning();
                });

                window.addEventListener('resize', function () {
                    thiz.scanner.layoutChanged();
                }, true);

                thiz.scanner.setSelectionListener(function (item) {
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(gridInstance.getCurrentGridId(), item.id);
                });

                thiz.hover.setSelectionListener(function (item) {
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(thiz.gridData.id, item.id);
                });

                thiz.clicker.setSelectionListener(function (item) {
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(thiz.gridData.id, item.id);
                });

                if (inputConfig.scanAutostart) {
                    thiz.scanner.startScanning();
                }
                if (inputConfig.hoverEnabled) {
                    thiz.hover.startHovering();
                }
                if (inputConfig.mouseclickEnabled) {
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
            }
        },
        computed: {
            filteredGrids: function () {
                return []
            },
        },
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            $(document).on(constants.EVENT_DB_PULL_UPDATED, reloadFn);
            $(document).on(constants.EVENT_SIDEBAR_OPEN, () => {
                thiz.metadata.fullscreen = false;
                $(document).trigger(constants.EVENT_GRID_RESIZE);
            });
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
                if (urlParamService.isScanningDisabled()) {
                    metadata.inputConfig.scanAutostart = false;
                }
                if (urlParamService.hideHeader()) {
                    metadata.headerPinned = false;
                }
                dataService.saveMetadata(metadata);
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                return Promise.resolve();
            }).then(() => {
                return initGrid(thiz.gridData.id);
            }).then(() => {
                thiz.initInputMethods();
                thiz.showGrid = true;
            }).catch((e) => {
                log.warn(e);
                Router.toManageGrids();
            });
        },
        updated() {
            I18nModule.init();
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, reloadFn);
            stopInputMethods();
            areService.unsubscribeEvents();
            if (gridInstance) {
                gridInstance.destroy();
                gridInstance = null;
            }
        }
    };

    function reloadFn(event, updatedIds, updatedDocs) {
        log.debug('got update event, ids updated:' + updatedIds);
        if (vueApp && gridInstance && gridInstance.isInitialized()) {
            let updatedGridDoc = updatedDocs.filter(doc => (vueApp.gridData && doc.id === vueApp.gridData.id))[0];
            let updatedMetadataDoc = updatedDocs.filter(doc => (vueApp.metadata && doc.id === vueApp.metadata.id))[0];
            if (updatedGridDoc) {
                vueApp.reload(new GridData(updatedGridDoc));
            }
            if (updatedMetadataDoc && updatedMetadataDoc.lastOpenedGridId !== vueApp.gridData.id) {
                Router.toLastOpenedGrid();
            }
        }
    }

    function stopInputMethods() {
        if (vueApp && vueApp.scanner) vueApp.scanner.stopScanning();
        if (vueApp && vueApp.hover) vueApp.hover.stopHovering();
        if (vueApp && vueApp.clicker) vueApp.clicker.stopClickcontrol();
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
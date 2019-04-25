<template>
    <div id="app" class="box" v-cloak>
        <header v-show="showHeader" @mousemove="resetHeaderHideTimeout()" @touchstart="resetHeaderHideTimeout(5000)" class="row header" role="banner">
            <div id="menuHeader" class="menuHeader">
                <a href="#main">
                    <img id="astericsIcon" class="inline" src="img/asterics_icon.png"/><h1 class="inline hide-mobile">AsTeRICS Grid</h1>
                </a>
                <div class="inline spaced">
                <span v-if="!isLocalUser" class="fa-stack fa-1x" style="margin-bottom: 1rem" :title="syncState | translate">
                    <i class="fas fa-cloud fa-stack-2x" style="color: lightblue"></i>
                    <i v-show="syncState === constants.DB_SYNC_STATE_SYNCINC" class="fas fa-sync-alt fa-stack-1x fa-spin" style="left: 3px; top: 1px"></i>
                    <i v-show="syncState === constants.DB_SYNC_STATE_SYNCED" class="fas fa-check fa-stack-1x" style="left: 3px; top: 2px"></i>
                    <i v-show="syncState === constants.DB_SYNC_STATE_STOPPED" class="fas fa-pause fa-stack-1x" style="left: 3px; top: 2px"></i>
                    <i v-show="syncState === constants.DB_SYNC_STATE_ONLINEONLY" class="fas fa-globe fa-stack-1x" style="left: 3px; top: 2px"></i>
                    <i v-show="!syncState || syncState === constants.DB_SYNC_STATE_FAIL" class="fas fa-times fa-stack-1x" style="left: 3px; top: 2px"></i>
                </span>
                </div>
                <div class="inline spaced">
                    <label class="inline" for="inHeaderPinned"><i class="fas fa-thumbtack"/> <span class="hide-mobile" data-i18n>Header pinned // Header angepinnt</span></label>
                    <input id="inHeaderPinned" type="checkbox" @change="setHeaderPinned" v-model="metadata.headerPinned"/>
                </div>
                <div class="inline right-mobile menuButtons">
                    <div class="inline spaced">
                        <div class="inline">
                            <button @click="showModal = true"><i class="fas fa-cog"/> <span class="hide-mobile" data-i18n>Input options // Eingabeoptionen</span></button>
                            <button @click="toEditGrid"><i class="fas fa-edit"/> <span class="hide-mobile" data-i18n>Edit grid // Grid bearbeiten</span></button>
                            <button @click="toManageGrids"><i class="fas fa-list-ul"/> <span class="hide-mobile" data-i18n>Manage grids // Grids verwalten</span></button>
                            <button @click="toLogin"><i class="fas fa-user"/> <span class="hide-mobile" data-i18n>Manage Users // User verwalten</span></button>
                        </div>
                    </div>
                </div>
            </div>
            <input-options-modal v-if="showModal" v-bind:metadata-property="metadata" v-bind:scanner="scanner" v-bind:hover="hover" v-bind:clicker="clicker" v-bind:reinit="reinitInputMethods" @close="showModal = false"/>
        </header>
        <main class="row content spaced" v-show="!gridData.gridElements || gridData.gridElements.length == 0" role="main">
            <div data-i18n="" style="margin-top: 2em">
                <span>No elements, click <a :href="'#grid/edit/' + gridData.id">Edit grid</a> to enter edit mode.</span>
                <span>Keine Elemente, klicke auf <a :href="'#grid/edit/' + gridData.id">Grid bearbeiten</a> um das Grid zu bearbeiten.</span>
            </div>
        </main>
        <div id="grid-mask" v-if="!showGrid" class="grid-container">
            <i class="fas fa-4x fa-spinner fa-spin"/>
        </div>
        <main role="main" class="row content">
            <div id="grid-container" class="grid-container">
            </div>
        </main>
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
    import {InputEventHandler} from "../../js/util/inputEventHandler";
    import {urlParamService} from "../../js/service/urlParamService";

    import {Scanner} from "../../js/input/scanning.js";
    import {Hover} from "../../js/input/hovering.js";
    import {Clicker} from "../../js/input/clicking.js";

    import InputOptionsModal from '../../vue-components/modals/inputOptionsModal.vue'
    import {constants} from "../../js/util/constants";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {GridData} from "../../js/model/GridData";
    import {I18nModule} from "../../js/i18nModule";

    let vueApp = null;
    let gridInstance = null;

    let vueConfig = {
        props: ['gridId'],
        data() {
            return {
                gridData: {},
                metadata: {},
                isScanning: null,
                showHeader: null,
                scanner: null,
                hover: null,
                clicker: null,
                showModal: false,
                showGrid: false,
                syncState: null,
                isLocalUser: localStorageService.isLastActiveUserLocal(),
                constants: constants,
                inputEventHandler: null,
                headerHideTimeoutHandler: null
            }
        },
        components: {
            InputOptionsModal
        },
        methods: {
            hideHeaderFn(alsoIfHidden) {
                let thiz = this;
                if ((!alsoIfHidden && !thiz.showHeader) || !gridInstance) return;

                thiz.showHeader = false;
                gridInstance.autosize(100);
                thiz.inputEventHandler.waitMouseUpperBorder().then(thiz.showHeaderFn);
                thiz.inputEventHandler.waitSwipedDown().then(() => {
                    thiz.showHeaderFn(false, 10000);
                });

            },
            showHeaderFn(alsoIfShown, hideTimeout) {
                let thiz = this;
                if ((!alsoIfShown && thiz.showHeader) || !gridInstance) return;

                thiz.showHeader = true;
                gridInstance.autosize(100);
                thiz.inputEventHandler.waitSwipedUp().then(thiz.hideHeaderFn);
                thiz.resetHeaderHideTimeout(hideTimeout);
            },
            resetHeaderHideTimeout(t) {
                let thiz = this;
                if (thiz.headerHideTimeoutHandler) {
                    clearTimeout(thiz.headerHideTimeoutHandler)
                }
                if (thiz.showHeader && !thiz.metadata.headerPinned) {
                    let headerHideTimeout = t || 3000;
                    thiz.headerHideTimeoutHandler = setTimeout(function () {
                        if (thiz.showModal) {
                            thiz.resetHeaderHideTimeout(t)
                        } else {
                            thiz.hideHeaderFn();
                        }
                    }, headerHideTimeout)
                }
            },
            setHeaderPinned: function (event) {
                this.metadata.headerPinned = event.target.checked;
                this.showHeaderFn();
                dataService.saveMetadata(this.metadata);
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
                thiz.isScanning = thiz.metadata.inputConfig.scanAutostart;
                thiz.showHeader = thiz.metadata.headerPinned;
                return Promise.resolve();
            }).then(() => {
                if (!thiz.isLocalUser) {
                    $(document).on(constants.EVENT_DB_SYNC_STATE_CHANGE, (event, syncState) => {
                        thiz.syncState = syncState;
                    });
                    thiz.syncState = dataService.getSyncState();
                }
                return initGrid(thiz.gridData.id);
            }).then(() => {
                thiz.inputEventHandler = new InputEventHandler('grid-container');
                if (thiz.metadata.headerPinned) {
                    this.showHeaderFn(true);
                } else {
                    this.hideHeaderFn(true);
                }
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
            clearTimeout(this.headerHideTimeoutHandler);
            if (gridInstance) {
                gridInstance.setLayoutChangedEndListener(null);
                gridInstance.setLayoutChangedStartListener(null);
                gridInstance = null;
            }
            if (this.inputEventHandler) {
                this.inputEventHandler.stopListening();
                this.inputEventHandler = null;
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
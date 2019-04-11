import $ from 'jquery';
import {L} from "../../lib/lquery.js";
import Vue from 'vue'
import {Grid} from "../grid.js";
import {actionService} from "../service/actionService";
import {dataService} from "../service/data/dataService";
import {areService} from "../service/areService";
import {Router} from "./../router.js";
import {MetaData} from "../model/MetaData.js";
import {InputEventHandler} from "../util/inputEventHandler";
import {urlParamService} from "../service/urlParamService";

import {Scanner} from "../input/scanning.js";
import {Hover} from "../input/hovering.js";
import {Clicker} from "../input/clicking.js";

import InputOptionsModal from '../../vue-components/inputOptionsModal.vue'
import {constants} from "../util/constants";
import {localStorageService} from "../service/data/localStorageService";

var GridView = {};
var _inputEventHandler = null;
var _headerHideTimeoutHandler = null;
let _vueApp = null;

GridView.init = function (gridId) {
    $(document).on(constants.EVENT_DB_PULL_UPDATED, reloadFn);
    dataService.getGrid(gridId).then(gridData => {
        if (!gridData) {
            log.warn('grid not found! gridId: ' + gridId);
            Router.toManageGrids();
            return;
        }
        if (gridData.hasAREModel()) {
            let areModel = gridData.getAREModel();
            areService.uploadAndStartModel(areModel.dataBase64, gridData.getAREURL(), areModel.fileName);
        }

        dataService.getMetadata().then(savedMetadata => {
            let metadata = new MetaData(savedMetadata) || new MetaData();
            metadata.lastOpenedGridId = gridId;
            if (urlParamService.isScanningDisabled()) {
                metadata.inputConfig.scanAutostart = false;
            }
            if (urlParamService.hideHeader()) {
                metadata.headerPinned = false;
            }
            dataService.saveMetadata(metadata);
            initVue(gridData, metadata);
        });
    });
};

GridView.destroy = function () {
    $(document).off(constants.EVENT_DB_PULL_UPDATED, reloadFn);
    stopInputMethods();
    areService.unsubscribeEvents();
    clearTimeout(_headerHideTimeoutHandler);
    GridView.grid = null;
    if(_inputEventHandler) {
        _inputEventHandler.stopListening();
        _inputEventHandler = null;
    }
};

function reloadFn(event, updatedIds, updatedDocs) {
    log.debug('got update event, ids updated:' + updatedIds);
    if (_vueApp) {
        if (_vueApp.gridData && updatedIds.includes(_vueApp.gridData.id)) {
            Router.toLastOpenedGrid(); //TODO only reload locally
        }

        //follow navigation, but not in only-only mode -> needs too much interaction with online database
        if (_vueApp.metadata && updatedIds.includes(_vueApp.metadata.id) && !(_vueApp && _vueApp.syncState === constants.DB_SYNC_STATE_ONLINEONLY)) {
            Router.toLastOpenedGrid();
        }
    }
}

function stopInputMethods() {
    if (_vueApp && _vueApp.scanner) _vueApp.scanner.stopScanning();
    if (_vueApp && _vueApp.hover) _vueApp.hover.stopHovering();
    if (_vueApp && _vueApp.clicker) _vueApp.clicker.stopClickcontrol();
}

function initGrid(gridId) {
    GridView.grid = new Grid('#grid-container', '.grid-item-content', {
        enableResizing: false,
        dragAndDrop: false,
        gridId: gridId
    });
    return GridView.grid.getInitPromise();
}

function initVue(gridData, metadata) {
    _vueApp = new Vue({
        el: '#app',
        data: {
            gridData: JSON.parse(JSON.stringify(gridData)),
            metadata: JSON.parse(JSON.stringify(metadata)),
            isScanning: metadata.inputConfig.scanAutostart,
            showHeader: metadata.headerPinned,
            scanner: null,
            hover: null,
            clicker: null,
            showModal: false,
            showGrid: false,
            syncState: null,
            isLocalUser: localStorageService.isLastActiveUserLocal(),
            constants: constants
        },
        components: {
            InputOptionsModal
        },
        methods: {
            hideHeaderFn(alsoIfHidden) {
                var thiz = this;
                if((!alsoIfHidden && !thiz.showHeader) || !GridView.grid) return;

                thiz.showHeader = false;
                GridView.grid.autosize(100);
                _inputEventHandler.waitMouseUpperBorder().then(thiz.showHeaderFn);
                _inputEventHandler.waitSwipedDown().then(() => {
                    thiz.showHeaderFn(false, 10000);
                });

            },
            showHeaderFn(alsoIfShown, hideTimeout) {
                var thiz = this;
                if((!alsoIfShown && thiz.showHeader) || !GridView.grid) return;

                thiz.showHeader = true;
                GridView.grid.autosize(100);
                _inputEventHandler.waitSwipedUp().then(thiz.hideHeaderFn);
                thiz.resetHeaderHideTimeout(hideTimeout);
            },
            resetHeaderHideTimeout(t) {
                var thiz = this;
                if(_headerHideTimeoutHandler) {
                    clearTimeout(_headerHideTimeoutHandler)
                }
                if(thiz.showHeader && !thiz.metadata.headerPinned) {
                    var headerHideTimeout = t || 3000;
                    _headerHideTimeoutHandler = setTimeout(function () {
                        if(thiz.showModal) {
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
                if (!GridView.grid) {
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
                if(inputConfig.areURL && inputConfig.areEvents.length > 0) {
                    var lastSelect = 0;
                    areService.subscribeEvents(function (eventString) {
                        if(inputConfig.areEvents.includes(eventString)) {
                            if(new Date().getTime() - lastSelect > 100) {
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

                GridView.grid.setLayoutChangedStartListener(function () {
                    thiz.scanner.pauseScanning();
                });
                GridView.grid.setLayoutChangedEndListener(function () {
                    thiz.scanner.resumeScanning();
                });

                window.addEventListener('resize', function () {
                    thiz.scanner.layoutChanged();
                }, true);

                thiz.scanner.setSelectionListener(function (item) {
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(GridView.grid.getCurrentGridId(), item.id);
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
            if (!thiz.isLocalUser) {
                $(document).on(constants.EVENT_DB_SYNC_STATE_CHANGE, (event, syncState) => {
                    thiz.syncState = syncState;
                });
                thiz.syncState = dataService.getSyncState();
            }
            initGrid(gridData.id).then(() => {
                _inputEventHandler = new InputEventHandler('grid-container');
                if (metadata.headerPinned) {
                    this.showHeaderFn(true);
                } else {
                    this.hideHeaderFn(true);
                }
                thiz.initInputMethods();
                thiz.showGrid = true;
            });
        }
    })
}

export {GridView};
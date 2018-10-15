import {L} from "../../lib/lquery.js";
import Vue from 'vue'
import {Grid} from "../grid.js";
import {actionService} from "../service/actionService";
import {dataService} from "../service/dataService";
import {Router} from "./../router.js";
import {MetaData} from "../model/MetaData.js";
import {InputEventHandler} from "../util/inputEventHandler";

import {Scanner} from "../input/scanning.js";
import {Hover} from "../input/hovering.js";
import {Clicker} from "../input/clicking.js";

import InputOptionsModal from '../../vue-components/inputOptionsModal.vue'

var GridView = {};
var _inputEventHandler = null;
var _headerHideTimeoutHandler = null;

GridView.init = function (gridId) {
    _inputEventHandler = new InputEventHandler('grid-container');
    dataService.getGrid(gridId).then(grid => {
        if (!grid) {
            log.warn('grid not found! gridId: ' + gridId);
            Router.toMain();
            return;
        }
        GridView.gridData = grid;

        dataService.getMetadata().then(savedMetadata => {
            GridView.metadata = new MetaData(savedMetadata) || new MetaData();
            initVue();
            dataService.saveMetadata(new MetaData({
                lastOpenedGridId: GridView.gridData.id
            }, savedMetadata));
        });
    });
};

GridView.destroy = function () {
    stopInputMethods();
    clearTimeout(_headerHideTimeoutHandler);
    GridView.grid = null;
    if(_inputEventHandler) {
        _inputEventHandler.stopListening();
        _inputEventHandler = null;
    }
};

function stopInputMethods() {
    if (GridView.scanner) GridView.scanner.stopScanning();
    if (GridView.hover) GridView.hover.stopHovering();
    if (GridView.clicker) GridView.clicker.stopClickcontrol();
}

function initGrid() {
    GridView.grid = new Grid('#grid-container', '.grid-item-content', {
        enableResizing: false,
        dragAndDrop: false,
        gridId: GridView.gridData.id
    });
    return GridView.grid.getInitPromise();
}

function initVue() {
    var app = new Vue({
        el: '#app',
        data: {
            gridData: JSON.parse(JSON.stringify(GridView.gridData)),
            metadata: JSON.parse(JSON.stringify(GridView.metadata)),
            isScanning: GridView.metadata.inputConfig.scanAutostart,
            showHeader: GridView.metadata.headerPinned,
            scanner: null,
            hover: null,
            clicker: null,
            showModal: false
        },
        components: {
            InputOptionsModal
        },
        methods: {
            hideHeaderFn(alsoIfHidden) {
                var thiz = this;
                if(!alsoIfHidden && !thiz.showHeader) return;

                thiz.showHeader = false;
                GridView.grid.autosize(100);
                _inputEventHandler.waitMouseUpperBorder().then(thiz.showHeaderFn);
                _inputEventHandler.waitSwipedDown().then(() => {
                    thiz.showHeaderFn(false, 10000);
                });

            },
            showHeaderFn(alsoIfShown, hideTimeout) {
                var thiz = this;
                if(!alsoIfShown && thiz.showHeader) return;

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
                var inputConfig = this.metadata.inputConfig;
                this.scanner = GridView.scanner = new Scanner('.grid-item-content', 'scanFocus', {
                    scanVertical: inputConfig.scanVertical,
                    subScanRepeat: 3,
                    scanBinary: inputConfig.scanBinary,
                    scanInactiveClass: 'scanInactive',
                    minBinarySplitThreshold: 3,
                    scanTimeoutMs: inputConfig.scanTimeoutMs,
                    scanTimeoutFirstElementFactor: inputConfig.scanTimeoutFirstElementFactor
                });
                this. hover = GridView.hover = new Hover('.grid-item-content', inputConfig.hoverTimeoutMs);
                this.clicker = GridView.clicker = new Clicker('.grid-item-content');

                GridView.grid.setLayoutChangedStartListener(function () {
                    GridView.scanner.pauseScanning();
                });
                GridView.grid.setLayoutChangedEndListener(function () {
                    GridView.scanner.resumeScanning();
                });

                window.addEventListener('resize', function () {
                    GridView.scanner.layoutChanged();
                }, true);

                GridView.scanner.setSelectionListener(function (item) {
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(GridView.grid.getCurrentGridId(), item.id);
                });

                GridView.hover.setSelectionListener(function (item) {
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(GridView.gridData.id, item.id);
                });

                GridView.clicker.setSelectionListener(function (item) {
                    L.removeAddClass(item, 'selected');
                    actionService.doAction(GridView.gridData.id, item.id);
                });

                if (inputConfig.scanAutostart) {
                    GridView.scanner.startScanning();
                }
                if (inputConfig.hoverEnabled) {
                    GridView.hover.startHovering();
                }
                if (inputConfig.mouseclickEnabled) {
                    GridView.clicker.startClickcontrol();
                }
            },
            reinitInputMethods() {
                stopInputMethods();
                dataService.getMetadata().then(newMetadata => {
                    this.metadata = GridView.metadata = JSON.parse(JSON.stringify(newMetadata));
                    this.initInputMethods();
                });
            },
            toEditGrid() {
                Router.toEditGrid(this.gridData.id);
            },
            toManageGrids() {
                Router.toManageGrids();
            }
        },
        computed: {
            filteredGrids: function () {
                return []
            },
        },
        mounted: function () {
            var thiz = this;
            initGrid().then(() => {
                if(GridView.metadata.headerPinned) {
                    this.showHeaderFn(true);
                } else {
                    this.hideHeaderFn(true);
                }
                thiz.initInputMethods();
            });
        }
    })
}

export {GridView};
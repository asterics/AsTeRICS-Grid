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

var GridView = {};
var _inputEventHandler = null;

GridView.init = function (gridId) {
    _inputEventHandler = new InputEventHandler();
    dataService.getGrid(gridId).then(grid => {
        if (!grid) {
            console.log('grid not found! gridId: ' + gridId);
            Router.toMain();
            return;
        }
        GridView.gridData = grid;

        var inputConfig = grid.inputConfig;
        GridView.scanner = new Scanner('.grid-item-content', 'scanFocus', {
            scanVertical: inputConfig.scanVertical,
            subScanRepeat: 3,
            scanBinary: inputConfig.scanBinary,
            scanInactiveClass: 'scanInactive',
            minBinarySplitThreshold: 3,
            scanTimeoutMs: inputConfig.scanTimeoutMs,
            scanTimeoutFirstElementFactor: inputConfig.scanTimeoutFirstElementFactor
        });
        GridView.hover = new Hover('.grid-item-content', inputConfig.hoverTimeoutMs);
        GridView.clicker = new Clicker('.grid-item-content');

        dataService.getMetadata().then(savedMetadata => {
            GridView.metadata = savedMetadata || new MetaData();
            initVue();
            dataService.saveMetadata(new MetaData({
                lastOpenedGridId: GridView.gridData.id
            }));
        });
    });
};

GridView.destroy = function () {
    if (GridView.scanner) GridView.scanner.stopScanning();
    if (GridView.hover) GridView.hover.stopHovering();
    if (GridView.clicker) GridView.clicker.stopClickcontrol();
    GridView.grid = null;
    if(_inputEventHandler) {
        _inputEventHandler.stopListening();
        _inputEventHandler = null;
    }
};

function initGrid() {
    GridView.grid = new Grid('#grid-container', '.grid-item-content', {
        enableResizing: false,
        dragAndDrop: false,
        gridId: GridView.gridData.id
    });
    GridView.grid.setLayoutChangedStartListener(function () {
        GridView.scanner.pauseScanning();
    });
    GridView.grid.setLayoutChangedEndListener(function () {
        GridView.scanner.resumeScanning();
    });
    return GridView.grid.getInitPromise();
}

function initVue() {
    var app = new Vue({
        el: '#app',
        data: {
            gridData: JSON.parse(JSON.stringify(GridView.gridData)),
            showInputOptions: false,
            isScanning: GridView.gridData.inputConfig.scanAutostart,
            showHeader: null,
            headerPinned: GridView.metadata.headerPinned,
            headerHideTimeoutHandler: null
        },
        methods: {
            hideHeaderFn() {
                var thiz = this;
                if(!thiz.showHeader && thiz.showHeader != null) return;

                thiz.showHeader = false;
                _inputEventHandler.waitMouseUpperBorder().then(thiz.showHeaderFn);
                _inputEventHandler.waitSwipedDown().then(() => {
                    thiz.showHeaderFn(10000);
                });

            },
            showHeaderFn(hideTimeout) {
                var thiz = this;

                thiz.showHeader = true;
                _inputEventHandler.waitSwipedUp().then(thiz.hideHeaderFn);
                thiz.resetHeaderHideTimeout(hideTimeout);
            },
            resetHeaderHideTimeout(t) {
                var thiz = this;
                if(thiz.headerHideTimeoutHandler) {
                    clearTimeout(thiz.headerHideTimeoutHandler)
                }
                if(thiz.showHeader && !thiz.headerPinned) {
                    var headerHideTimeout = t || 3000;
                    thiz.headerHideTimeoutHandler = setTimeout(function () {
                        thiz.hideHeaderFn();
                    }, headerHideTimeout)
                }
            },
            toggleInputMenu: function () {
                this.showInputOptions = !this.showInputOptions;
            },
            setHeaderPinned: function (event) {
                this.headerPinned = event.target.checked;
                this.showHeaderFn();
                dataService.saveMetadata(new MetaData({
                    headerPinned: this.headerPinned
                }));
            },
            setHover: function (event) {
                if (event.target.checked) {
                    GridView.hover.startHovering();
                } else {
                    GridView.hover.stopHovering();
                }
                dataService.updateInputConfig(GridView.gridData.id, {
                    hoverEnabled: event.target.checked
                });
            },
            changeHoverMs: function (event) {
                var newOptions = {
                    hoverTimeoutMs: Number.parseInt(event.target.value)
                };
                GridView.hover.setHoverTimeout(newOptions.hoverTimeoutMs);
                dataService.updateInputConfig(GridView.gridData.id, newOptions);
            },
            setClickControl: function (event) {
                if (event.target.checked) {
                    GridView.clicker.startClickcontrol();
                } else {
                    GridView.clicker.stopClickcontrol();
                }
                dataService.updateInputConfig(GridView.gridData.id, {
                    mouseclickEnabled: event.target.checked
                });
            },
            toggleScanning: function () {
                if (this.isScanning) {
                    GridView.scanner.stopScanning();
                } else {
                    GridView.scanner.startScanning();
                }
                this.isScanning = !this.isScanning;
                dataService.updateInputConfig(GridView.gridData.id, {
                    scanAutostart: this.isScanning
                });
            },
            setVerticalScanning: function (event) {
                this.updateScanningOptions({
                    scanVertical: event.target.checked
                }, true);
            },
            setBinaryScanning: function (event) {
                this.updateScanningOptions({
                    scanBinary: event.target.checked
                }, true);
            },
            changeScanningMs: function (event) {
                this.updateScanningOptions({
                    scanTimeoutMs: Number.parseInt(event.target.value)
                });
            },
            changeFirstElementFactor: function (event) {
                this.updateScanningOptions({
                    scanTimeoutFirstElementFactor: Number.parseFloat(event.target.value)
                });
            },
            updateScanningOptions: function (optionsToUpdate, restart) {
                GridView.scanner.updateOptions(optionsToUpdate, restart);
                dataService.updateInputConfig(GridView.gridData.id, optionsToUpdate);
            }
        },
        computed: {
            filteredGrids: function () {
                return []
            },
        },
        created: function () {
            window.addEventListener('resize', function () {
                GridView.scanner.layoutChanged();
            }, true);

            GridView.scanner.setSelectionListener(function (item) {
                L.toggleClass(item, 'selected');
                actionService.doAction(GridView.grid.getCurrentGridId(), item.id);
            });

            GridView.hover.setSelectionListener(function (item) {
                L.toggleClass(item, 'selected');
                actionService.doAction(GridView.gridData.id, item.id);
            });

            GridView.clicker.setSelectionListener(function (item) {
                L.toggleClass(item, 'selected');
                actionService.doAction(GridView.gridData.id, item.id);
            });

            if(GridView.metadata.headerPinned) {
                this.showHeaderFn();
            } else {
                this.hideHeaderFn();
            }
        },
        mounted: () => {
            initGrid().then(() => {
                GridView.grid.autosize();
                if (GridView.gridData.inputConfig.scanAutostart) {
                    GridView.scanner.startScanning();
                }
                if (GridView.gridData.inputConfig.hoverEnabled) {
                    GridView.hover.startHovering();
                }
                if (GridView.gridData.inputConfig.mouseclickEnabled) {
                    GridView.clicker.startClickcontrol();
                }
            });
        },
        updated: () => {
            if(GridView.grid) GridView.grid.autosize();
        }
    })
}

export {GridView};
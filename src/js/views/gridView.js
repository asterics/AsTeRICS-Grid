import {L} from "../../lib/lquery.js";
import Vue from 'vue'
import {Grid} from "../grid.js";
import {actionService} from "../service/actionService";
import {dataService} from "../service/dataService";
import {MetaData} from "../model/MetaData.js";

import {Scanner} from "../scanning.js";
import {Hover} from "../hovering.js";

var GridView = {};

GridView.init = function (gridId) {
    dataService.getGrid(gridId).then(grid => {
        if (!grid) {
            console.log('grid not found! gridId: ' + gridId);
            return;
        }
        GridView.gridData = grid;
        dataService.saveMetadata(new MetaData({
            lastOpenedGridId: GridView.gridData.id
        }));
        var scanningConfig = grid.scanningConfig;
        L('#chkVerticalScanning').checked = scanningConfig.verticalScan;
        L('#chkBinaryScanning').checked = scanningConfig.binaryScanning;
        L('#inScanTime').value = scanningConfig.scanTimeoutMs;
        GridView.scanner = new Scanner('.grid-item-content', 'scanFocus', {
            verticalScan: scanningConfig.verticalScan,
            subScanRepeat: 3,
            binaryScanning: scanningConfig.binaryScanning,
            scanInactiveClass: 'scanInactive',
            minBinarySplitThreshold: 3,
            scanTimeoutMs: scanningConfig.scanTimeoutMs
        });
        GridView.hover = new Hover('.grid-item-content');
        initGrid().then(() => {
            initVue();
            GridView.scanner.startScanning();
        });
    });
};

GridView.destroy = function () {
    if (GridView.scanner) GridView.scanner.stopScanning();
    if (GridView.hover) GridView.hover.stopHovering();
    GridView.grid = null;
};


function initGrid() {
    GridView.grid = new Grid('#grid-container', '.grid-item-content', {
        enableResizing: true,
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
            gridData: GridView.gridData,
        },
        methods: {
            toggleInputMenu: function () {
                L.toggle('#menuExpandedInputOpts');
                GridView.grid.autosize();
            },
            startScanning: function () {
                GridView.scanner.startScanning();
            },
            stopScanning: function () {
                GridView.scanner.stopScanning();
            },
            setHover: function (event) {
                if (event.target.checked) {
                    GridView.hover.startHovering();
                } else {
                    GridView.hover.stopHovering();
                }
            },
            changeRowCount: function (event) {
                GridView.grid.setNumberOfRows(event.target.value);
            },
            changeScanningMs: function (event) {
                this.updateScanningOptions({
                    scanTimeoutMs: Number.parseInt(event.target.value)
                }, true);
            },
            setVerticalScanning: function (event) {
                this.updateScanningOptions({
                    verticalScan: event.target.checked
                }, true);
            },
            setBinaryScanning: function (event) {
                this.updateScanningOptions({
                    binaryScanning: event.target.checked
                }, true);
            },
            updateScanningOptions: function (optionsToUpdate, restart) {
                GridView.scanner.updateOptions(optionsToUpdate, restart);
                dataService.updateScanningConfig(GridView.gridData.id, optionsToUpdate);
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
        }
    })
}

export {GridView};
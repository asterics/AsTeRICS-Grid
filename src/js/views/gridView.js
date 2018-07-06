import {L} from "../../lib/lquery.js";
import {Grid} from "../grid.js";
import {actionService} from "../service/actionService";
import {dataService} from "../service/dataService";

import {Scanner} from "../scanning.js";
import {Hover} from "../hovering.js";

var GridView = {};
GridView.gridId = null; //TODO

GridView.init = function() {
    dataService.getGrids().then(grids => {
        var grid = grids[0];
        GridView.gridId = grid.id; // TODO let user choose the grid to show
        dataService.getScanningConfig(GridView.gridId).then(scanningConfig => {
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
                initUiOptions(grid);
                initListeners();
                GridView.scanner.startScanning();
            });
        });
    });
};

GridView.destroy = function () {
    if(GridView.scanner) GridView.scanner.stopScanning();
    if(GridView.hover) GridView.hover.stopHovering();
};


function initGrid() {
    GridView.grid = new Grid('#grid-container', '.grid-item-content', {
        enableResizing: true,
        gridId: GridView.gridId
    });
    GridView.grid.setLayoutChangedStartListener(function () {
        GridView.scanner.pauseScanning();
    });
    GridView.grid.setLayoutChangedEndListener(function () {
        GridView.scanner.resumeScanning();
    });
    return GridView.grid.getInitPromise();
}

function reinit() {
    window.location.reload();
}

function initUiOptions(grid){
    L('#inNumberRows').value = grid.rowCount;
}

function initListeners() {
    L('#btnMenuInputOpts').addEventListener('click', function () {
        L.toggle('#menuExpandedInputOpts');
        GridView.grid.autosize();
    });

    L('#btnStartScan').addEventListener('click', function () {
        GridView.scanner.startScanning();
    });

    L('#btnStopScan').addEventListener('click', function () {
        GridView.scanner.stopScanning();
    });

    L('#inScanTime').addEventListener('change', function (event) {
        updateScanningOptions({
            scanTimeoutMs: Number.parseInt(event.target.value)
        });
    });

    L('#chkVerticalScanning').addEventListener('change', function (event) {
        updateScanningOptions({
            verticalScan: event.target.checked
        }, true);
    });

    L('#chkBinaryScanning').addEventListener('change', function (event) {
        updateScanningOptions({
            binaryScanning: event.target.checked
        }, true);
    });

    L('#chkHover').addEventListener('change', function (event) {
        if (event.target.checked) {
            GridView.hover.startHovering();
        } else {
            GridView.hover.stopHovering();
        }
    });

    L('#inNumberRows').addEventListener('change', function (event) {
        GridView.grid.setNumberOfRows(event.target.value);
    });

    L('#btnExportDB').addEventListener('click', function (event) {
        dataService.downloadDB();
    });

    L('#inImportDB').addEventListener('change', function (event) {
        dataService.importDB(event.target.files[0]).then(() => {
            reinit();
        });
    });

    window.addEventListener('resize', function () {
        GridView.scanner.layoutChanged();
    }, true);

    GridView.scanner.setSelectionListener(function (item) {
        L.toggleClass(item, 'selected');
        actionService.doAction(GridView.grid.getCurrentGridId(), item.id);
    });

    GridView.hover.setSelectionListener(function (item) {
        L.toggleClass(item, 'selected');
        actionService.doAction(GridView.gridId, item.id);
    });
}

function updateScanningOptions(optionsToUpdate, restart) {
    GridView.scanner.updateOptions(optionsToUpdate, restart);
    dataService.updateScanningConfig(GridView.gridId, optionsToUpdate);
}

export {GridView};
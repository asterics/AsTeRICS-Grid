import domI18n from '../../node_modules/dom-i18n/dist/dom-i18n.min';
import {L} from "../lib/lquery.js";
import {Grid} from "./grid.js";
import {actionService} from "./service/actionService";
import {dataService} from "./service/dataService";

import {Scanner} from "./scanning.js";
import {Hover} from "./hovering.js";

var thiz = {};
thiz.gridId = null; //TODO

function init() {
    domI18n({
        selector: '[data-i18n]',
        separator: ' // ',
        languages: ['en', 'de']
    });

    var scanningConfig = dataService.getScanningConfig(thiz.gridId);
    L('#chkVerticalScanning').checked = scanningConfig.verticalScan;
    L('#chkBinaryScanning').checked = scanningConfig.binaryScanning;
    thiz.scanner = new Scanner('.grid-item-content', 'scanFocus', {
        verticalScan: scanningConfig.verticalScan,
        subScanRepeat: 3,
        binaryScanning: scanningConfig.binaryScanning,
        scanInactiveClass: 'scanInactive',
        minBinarySplitThreshold: 3
    });
    thiz.hover = new Hover('.grid-item-content');
    initGrid();
    initUiOptions();
}
init();

function initGrid() {
    thiz.grid = new Grid('#grid-container', '.grid-item-content', {
        enableResizing: true
    });
    thiz.grid.setLayoutChangedStartListener(function () {
        thiz.scanner.pauseScanning();
    });
    thiz.grid.setLayoutChangedEndListener(function () {
        thiz.scanner.resumeScanning();
    });
}

function initUiOptions(){
    L('#inNumberRows').value = dataService.getGrid().rowCount;
}

L('#btnStartScan').addEventListener('click', function () {
    thiz.scanner.startScanning();
});

L('#btnStopScan').addEventListener('click', function () {
    thiz.scanner.stopScanning();
});

L('#inScanTime').addEventListener('change', function (event) {
    updateScanningOptions({
        scanTimeoutMs: event.target.value
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
        thiz.hover.startHovering();
    } else {
        thiz.hover.stopHovering();
    }
});

L('#inNumberRows').addEventListener('change', function (event) {
    thiz.grid.setNumberOfRows(event.target.value);
});

window.addEventListener('resize', function () {
    thiz.scanner.layoutChanged();
}, true);

thiz.scanner.setSelectionListener(function (item) {
    L.toggleClass(item, 'selected');
    actionService.doAction(thiz.grid.getCurrentGridId(), item.id);
});

thiz.hover.setSelectionListener(function (item) {
    L.toggleClass(item, 'selected');
});

function updateScanningOptions(optionsToUpdate, restart) {
    thiz.scanner.updateOptions(optionsToUpdate, restart);
    dataService.updateScanningConfig(thiz.gridId, optionsToUpdate);
}

thiz.scanner.startScanning();
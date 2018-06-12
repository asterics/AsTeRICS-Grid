//import Muuri from 'muuri';
import domI18n from '../../node_modules/dom-i18n/dist/dom-i18n.min';
import {L} from "../lib/lquery.js";
import {tempates} from "./templates.js";
import {Scanner} from "./scanning.js";
import {Hover} from "./hovering.js";

var thiz = {};
function init() {
    domI18n({
        selector: '[data-i18n]',
        separator: ' // ',
        languages: ['en', 'de']
    });

    thiz.scanner = new Scanner('.item', 'scanFocus', {
        verticalScan: L('#chkVerticalScanning').checked,
        subScanRepeat: 3,
        binaryScanning: L('#chkBinaryScanning').checked,
        scanInactiveClass: 'scanInactive',
        minBinarySplitThreshold: 3
    });
    thiz.hover = new Hover('.item');
    initGrid();
}
init();

function initGrid() {
    //L.removeAllChildren('#grid');
    for (var i = 0; i < 30; i++) {
        var sizeX = L.getRandomInt(1,3);
        var sizeY = L.getRandomInt(1,3);
        L('#grid').insertAdjacentHTML('beforeend', tempates.getGridItem(i, sizeX, sizeY));
    }

    /*thiz.grid = new Muuri('#grid', {
        dragEnabled: true,
    });

    thiz.grid.on('dragInit', function (items) {
        thiz.scanner.pauseScanning();
    });
    thiz.grid.on('dragReleaseEnd', function (items) {
        thiz.scanner.resumeScanning();
    });*/
}

L('#btnStartScan').addEventListener('click', function () {
    thiz.scanner.startScanning();
});

L('#btnStopScan').addEventListener('click', function () {
    thiz.scanner.stopScanning();
});

L('#inScanTime').addEventListener('change', function (event) {
    thiz.scanner.updateOptions({
        scanTimeoutMs: event.target.value
    });
});

L('#chkVerticalScanning').addEventListener('change', function (event) {
    thiz.scanner.updateOptions({
        verticalScan: event.target.checked
    }, true);
});

L('#chkBinaryScanning').addEventListener('change', function (event) {
    thiz.scanner.updateOptions({
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

window.addEventListener('resize', function () {
    thiz.scanner.layoutChanged();
}, true);

thiz.scanner.setSelectionListener(function (item) {
    console.log('selected: ' + item);
    L.toggleClass(item, 'selected');
});

thiz.hover.setSelectionListener(function (item) {
    console.log('selected: ' + item);
    L.toggleClass(item, 'selected');
});

//thiz.scanner.startScanning();
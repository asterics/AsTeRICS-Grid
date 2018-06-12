import $ from 'jquery';
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

    thiz.scanner = new Scanner('.grid-item-content', 'scanFocus', {
        verticalScan: L('#chkVerticalScanning').checked,
        subScanRepeat: 3,
        binaryScanning: L('#chkBinaryScanning').checked,
        scanInactiveClass: 'scanInactive',
        minBinarySplitThreshold: 3
    });
    thiz.hover = new Hover('.grid-item-content');
    initGrid();
}
init();

function initGrid() {
    //L.removeAllChildren('#grid');
    for (var i = 0; i < 50; i++) {
        var sizeX = L.getRandomInt(1,1);
        var sizeY = L.getRandomInt(1,1);
        L('#grid').insertAdjacentHTML('beforeend', tempates.getGridItem(i, sizeX, sizeY));
    }

    var grid = $('#grid').gridList({
        lanes: 10,
        widthHeightRatio: 1,
        heightToFontSizeRatio: 0.25,
    });
    $('#grid').gridList('resize', 9);
    $(window).resize(function() {
        $('#grid').gridList('reflow');
    });

    var itemSize = 77;
    var border = 5;
    $('.grid-item-content').resizable({
        grid: [itemSize + 2 * border, itemSize + 2 * border],
        autoHide: true,
        handles: 'se',
        resize: function( event, ui ) {
            ui.element.parent().css('z-index', 1);
            var w = Math.round(ui.element.width() / (itemSize + 2 * border));
            var h = Math.round(ui.element.height() / (itemSize + 2 * border));
            console.log('w: ' + w + " , h: " + h);
            $('#grid').gridList('resizeItem', ui.element.parent(), {
                w: w,
                h: h
            });
            ui.element.css('height', '');
            ui.element.css('width', '');
        }
    });

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
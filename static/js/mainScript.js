import { tempates } from "./templates.js";
import { Scanner } from "./scanning.js";
import { Hover } from "./hovering.js";

var scanner = new Scanner('.item-content', 'scanFocus', {
    verticalScan: L('#chkVerticalScanning').checked,
    subScanRepeat: 3,
    binaryScanning: L('#chkBinaryScanning').checked,
    scanInactiveClass: 'scanInactive'
});
var hover = new Hover('.item-content');

for(var i = 0; i<70; i++) {
    L('#grid').insertAdjacentHTML('beforeend', tempates.getGridItem(i));
}

var grid = new Muuri('#grid', {
    dragEnabled: true,
});
grid.on('dragInit', function (items) {
    scanner.pauseScanning();
});
grid.on('dragReleaseEnd', function (items) {
    scanner.resumeScanning();
});

L('#btnStartScan').addEventListener('click', function () {
    scanner.startScanning();
});

L('#btnStopScan').addEventListener('click', function () {
    scanner.stopScanning();
});

L('#inScanTime').addEventListener('change', function (event) {
    scanner.updateOptions({
        scanTimeoutMs: event.target.value
    });
});

L('#chkVerticalScanning').addEventListener('change', function (event) {
    scanner.updateOptions({
        verticalScan: event.target.checked
    }, true);
});

L('#chkBinaryScanning').addEventListener('change', function (event) {
    scanner.updateOptions({
        binaryScanning: event.target.checked
    }, true);
});

L('#chkHover').addEventListener('change', function (event) {
    if(event.target.checked) {
        hover.startHovering();
    } else {
        hover.stopHovering();
    }
});

window.addEventListener('resize', function(){
    scanner.layoutChanged();
}, true);

scanner.setSelectionListener(function (item) {
    console.log('selected: ' + item);
    L.toggleClass(item, 'selected');
});

hover.setSelectionListener(function (item) {
    console.log('selected: ' + item);
    L.toggleClass(item, 'selected');
});

scanner.startScanning();
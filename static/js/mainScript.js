import { tempates } from "./templates.js";
import { Scanner } from "./scanning.js";
import { Hover } from "./hovering.js";

var scanner = new Scanner('.item-content', 'scanFocus', {
    verticalScan: true,
    subScanRepeat: 3,
    binaryScanning: true,
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
grid.on('dragEnd', function (items) {
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

window.addEventListener('resize', function(){
    scanner.layoutChanged();
}, true);

scanner.setSelectionListener(function (item) {
    console.log('selected: ' + item);
    L.addClass(item, 'selected');
});

hover.setSelectionListener(function (item) {
    console.log('selected: ' + item);
    L.addClass(item, 'selected');
});

document.onkeydown = function (event) {
    console.log(event);
    if(event.keyCode == 49) {
        scanner.select();
    }
};

hover.startHovering();
import { tempates } from "./templates.js";
import { Scanner } from "./scanning.js";

var scanner = new Scanner('.item-content', 'scanFocus');

for(var i = 0; i<20; i++) {
    L('#grid').insertAdjacentHTML('beforeend', tempates.getGridItem(i));
}

var grid = new Muuri('#grid', {
    dragEnabled: true,
});

L('#btnStartScan').addEventListener('click', function () {
    scanner.startScanning(true);
});

L('#btnStopScan').addEventListener('click', function () {
    scanner.stopScanning();
});

L('#inScanTime').addEventListener('change', function (event) {
    scanner.setScanTimeout(event.target.value);
});

scanner.setSelectionListener(function (item) {
    console.log('selected: ' + item);
    L.addClass(item, 'selected');
});

document.onkeydown = function (event) {
    console.log(event);
    if(event.keyCode == 49) {
        scanner.select();
    }
};
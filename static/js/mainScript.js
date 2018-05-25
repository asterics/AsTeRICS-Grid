import { tempates } from "./templates.js";
import { scanner } from "./scanning.js";

for(var i = 0; i<20; i++) {
    L('#grid').insertAdjacentHTML('beforeend', tempates.getGridItem(i));
}

var grid = new Muuri('#grid', {
    dragEnabled: true,
});

L('#btnStartScan').addEventListener('click', function () {
    scanner.startScanning('.item-content', 'scanFocus');
});

L('#btnStopScan').addEventListener('click', function () {
    scanner.stopScanning();
});

L('#inScanTime').addEventListener('change', function (event) {
    scanner.setScanTimeout(event.target.value);
});
var scanner = {};
var _isScanning = false;
var _scanTimeoutMs = 1000;
var _selectionListener = null;
var _currentActiveScanElements = null;

function getRows(elemSelector, groupingFn) {
    groupingFn = groupingFn || getYPos;
    var keys = [];
    var rows = {};
    L.selectAsList(elemSelector).forEach(function (item) {
        var yPos = groupingFn(item);
        if (keys.indexOf(yPos) != -1) {
            rows[yPos].push(item);
        } else {
            keys.push(yPos);
            rows[yPos] = [item];
        }
    });
    keys = keys.sort((a, b) => a - b);
    return keys.map(key => rows[key]);
}

function getYPos(item) {
    return item.getBoundingClientRect().top;
}

function getXPos(item) {
    return item.getBoundingClientRect().left;
}

function scan(itemSelector, scanActiveClass, verticalScan, index) {
    L.removeClass(itemSelector, scanActiveClass);
    if(_isScanning) {
        index = index || 0;
        var groupingFn = verticalScan ? getXPos : getYPos;
        var rows = getRows(itemSelector, groupingFn);
        if (index > rows.length - 1) {
            index = 0;
        }
        L.addClass(rows[index], scanActiveClass);
        _currentActiveScanElements = rows[index];
        setTimeout(function () {
            scan(itemSelector, scanActiveClass, verticalScan, index + 1);
        }, _scanTimeoutMs);
    }
}

scanner.startScanning = function(itemSelector, scanActiveClass, verticalScan) {
    _isScanning = true;
    scan(itemSelector, scanActiveClass, verticalScan);
};

scanner.stopScanning = function() {
    _isScanning = false;
};

scanner.setScanTimeout = function(timeoutMs) {
    _scanTimeoutMs = timeoutMs;
};

scanner.setSelectionListener = function (fn) {
    _selectionListener = fn; //TODO use
};

scanner.select = function () {
    //TODO
};

export {scanner};
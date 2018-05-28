function Scanner(itemSelector, scanActiveClass) {
    var thiz = this;
    var _itemSelector = itemSelector;
    var _scanActiveClass = scanActiveClass;
    var _isScanning = false;
    var _scanTimeoutMs = 1000;
    var _selectionListener = null;
    var _currentActiveScanElements = null;
    var _scanTimeoutHandler = null;
    var _verticalScan = null;
    var _subScanRepeat = 3;
    var _splitThreshold = 3;

    function getGroups(elements, groupingFn) {
        groupingFn = groupingFn || getYPos;
        elements = elements || [];
        var keys = [];
        var rows = {};
        elements.forEach(function (item) {
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

    function scan(verticalScan, index) {
        var elements = L.selectAsList(_itemSelector);
        _verticalScan = verticalScan;
        L.removeClass(_itemSelector, _scanActiveClass);
        if(_isScanning) {
            index = index || 0;
            var groupingFn = verticalScan ? getXPos : getYPos;
            var rows = getGroups(elements, groupingFn);
            if (index > rows.length - 1) {
                index = 0;
            }
            L.addClass(rows[index], _scanActiveClass);
            _currentActiveScanElements = rows[index];
            _scanTimeoutHandler = setTimeout(function () {
                scan(verticalScan, index + 1);
            }, _scanTimeoutMs);
        }
    }

    function subscan(elems, index, count) {
        elems = elems || [];
        count = count || 0;
        index = index || 0;
        index = (index <= elems.length - 1) ? index : 0;
        if(count >= _subScanRepeat * elems.length) {
            thiz.stopScanning();
            _isScanning = true;
            scan(_verticalScan);
            return;
        }
        L.removeClass(_itemSelector, _scanActiveClass);

        if(_isScanning) {
            L.addClass(elems[index], _scanActiveClass);
            _currentActiveScanElements = elems[index];
            _scanTimeoutHandler = setTimeout(function () {
                subscan(elems, index + 1, count + 1);
            }, _scanTimeoutMs);
        }
    }

    function spitToSubarrays(array) {
        var returnArray = [];
        array = array || [];
        var chunk = 1;
        if(array.length > _splitThreshold) {
            chunk = Math.ceil(array.length/2);
        }
        for (var i=0, j=array.length; i<j; i+=chunk) {
            var temparray = array.slice(i,i+chunk);
            returnArray.push(temparray);
        }
        return returnArray;
    }

    thiz.startScanning = function(verticalScan) {
        if(!_isScanning) {
            _isScanning = true;
            scan(verticalScan);
        }
    };

    thiz.stopScanning = function() {
        _isScanning = false;
        if(_scanTimeoutHandler) {
            clearTimeout(_scanTimeoutHandler);
        }
        L.removeClass(_itemSelector, _scanActiveClass);
    };

    thiz.setScanTimeout = function(timeoutMs) {
        _scanTimeoutMs = timeoutMs;
    };

    thiz.setSelectionListener = function (fn) {
        _selectionListener = fn;
    };

    thiz.select = function () {
        if(_isScanning) {
            thiz.stopScanning();
            _isScanning = true;
            if(_currentActiveScanElements.length > 1) {
                subscan(spitToSubarrays(_currentActiveScanElements));
            } else if(_selectionListener) {
                _selectionListener(_currentActiveScanElements[0]);
                scan(_verticalScan);
            }
        }
    };
}


export {Scanner};
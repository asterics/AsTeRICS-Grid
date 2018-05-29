function Scanner(itemSelector, scanActiveClass, options) {
    var thiz = this;

    //options
    var itemSelector = itemSelector;
    var scanActiveClass = scanActiveClass;
    var scanInactiveClass = '';
    var scanTimeoutMs = 1000;
    var verticalScan = false;
    var subScanRepeat = 3;
    var minBinarySplitThreshold = 3; // for binary scanning: if there are [n] or less scanning possibilities they will not be split up again, but will be scanned in linear fashion
    var binaryScanning = false;

    //internal
    var _selectionListener = null;
    var _isScanning = false;
    var _currentActiveScanElements = null;
    var _scanTimeoutHandler = null;
    var _layoutChangeTimeoutHandler = null;
    var _scanningPaused = false;

    function parseOptions(options) {
        if (options) {
            scanTimeoutMs = options.scanTimeoutMs || scanTimeoutMs;
            verticalScan = options.verticalScan || verticalScan;
            subScanRepeat = options.subScanRepeat || subScanRepeat;
            minBinarySplitThreshold = options.minBinarySplitThreshold || minBinarySplitThreshold;
            binaryScanning = options.binaryScanning || binaryScanning;
            scanInactiveClass = options.scanInactiveClass || scanInactiveClass;
        }
    }

    parseOptions(options);

    function getGroups(elements, groupingFn) {
        groupingFn = groupingFn || getYPos;
        elements = elements || [];
        var keys = [];
        var rows = {};
        elements.forEach(function (item) {
            var yPos = groupingFn(item, elements);
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

    function scan(elems, index, count) {
        elems = elems || [];
        count = count || 0;
        index = index || 0;
        index = (index <= elems.length - 1) ? index : 0;
        if (count >= subScanRepeat * elems.length) {
            thiz.restartScanning();
            return;
        }
        L.removeClass(itemSelector, scanActiveClass);
        L.addClass(itemSelector, scanInactiveClass);

        if (_isScanning) {
            L.addClass(elems[index], scanActiveClass);
            L.removeClass(elems, scanInactiveClass);
            _currentActiveScanElements = elems[index];
            _scanTimeoutHandler = setTimeout(function () {
                scan(elems, index + 1, count + 1);
            }, scanTimeoutMs);
        }
    }

    function spitToSubarrays(array) {
        var returnArray = [];
        array = array || [];
        var chunk = 1;
        if (binaryScanning && array.length > minBinarySplitThreshold) {
            chunk = Math.ceil(array.length / 2);
        }
        for (var i = 0, j = array.length; i < j; i += chunk) {
            var temparray = array.slice(i, i + chunk);
            returnArray.push(temparray);
        }
        return returnArray;
    }

    thiz.startScanning = function () {
        if (!_isScanning) {
            var elements = L.selectAsList(itemSelector);
            var groupingFn = verticalScan ? getXPos : getYPos;
            var rows = getGroups(elements, groupingFn);
            _isScanning = true;
            scan(spitToSubarrays(rows));
        }
    };

    thiz.stopScanning = function () {
        _isScanning = false;
        if (_scanTimeoutHandler) {
            clearTimeout(_scanTimeoutHandler);
        }
        L.removeClass(itemSelector, scanActiveClass);
        L.removeClass(itemSelector, scanInactiveClass);
    };

    /**
     * stops and re-starts scanning directly afterwards
     */
    thiz.restartScanning = function () {
        thiz.stopScanning();
        thiz.startScanning(verticalScan);
    };

    /**
     * stops scanning, if it is already running. same functionality as stopScanning() with the difference that a call
     * of resumeScanning() afterwards will re-start scanning while it will not if it was stopped with stopScanning().
     */
    thiz.pauseScanning = function () {
        if (_isScanning) {
            thiz.stopScanning();
            _scanningPaused = true;
        }
    };

    /**
     * starts scanning if it was paused before with pauseScanning(). Does not start scanning if it never run or
     * if it was stopped with stopScanning().
     */
    thiz.resumeScanning = function () {
        if (_scanningPaused) {
            thiz.startScanning();
            _scanningPaused = false;
        }
    };

    thiz.updateOptions = function (options) {
        parseOptions(options);
    };

    /**
     * sets a method that is called if an item was selected by scanning. The function will be called with the selected
     * item as first parameter.
     * @param fn
     */
    thiz.setSelectionListener = function (fn) {
        if (L.isFunction(fn)) {
            _selectionListener = fn;
        }
    };

    /**
     * method to be called if the layout of elements changed and scanning should be restarted in order to adapt
     * to new layout. If this method is called multiple times in the timeout period, restarting of scanning will
     * be postponed to: [time of last call to layoutChanged()] + [timeout].
     * @param timeout the timeout to wait before restarting scanning in milliseconds, default: 1000ms.
     */
    thiz.layoutChanged = function (timeout) {
        timeout = timeout || 1000;
        if (_isScanning) {
            thiz.stopScanning();
            _layoutChangeTimeoutHandler = setTimeout(function () {
                _layoutChangeTimeoutHandler = null;
                thiz.restartScanning();
            }, timeout);
        } else if (_layoutChangeTimeoutHandler) {
            clearTimeout(_layoutChangeTimeoutHandler);
            _layoutChangeTimeoutHandler = setTimeout(function () {
                _layoutChangeTimeoutHandler = null;
                thiz.restartScanning();
            }, timeout);
        }
    };

    /**
     * method to call to select the current scan item(s). For instance it could be called inside a keyboard
     * event listener.
     */
    thiz.select = function () {
        if (_isScanning) {
            thiz.stopScanning();
            _isScanning = true;
            if (_currentActiveScanElements.length > 1) {
                scan(spitToSubarrays(_currentActiveScanElements));
            } else if (L.flattenArray(_currentActiveScanElements).length > 1) {
                scan(spitToSubarrays(L.flattenArray(_currentActiveScanElements)));
            } else if (_selectionListener) {
                _selectionListener(_currentActiveScanElements[0]);
                thiz.restartScanning();
            }
        }
    };
}

export {Scanner};
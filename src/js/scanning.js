import {L} from "../lib/lquery.js";

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
    var _keydownEventListeners = [];

    function init() {
        parseOptions(options);
    }

    function parseOptions(options) {
        if (options) {
            scanTimeoutMs = options.scanTimeoutMs || scanTimeoutMs;
            subScanRepeat = options.subScanRepeat || subScanRepeat;
            minBinarySplitThreshold = options.minBinarySplitThreshold || minBinarySplitThreshold;
            scanInactiveClass = options.scanInactiveClass || scanInactiveClass;

            verticalScan = options.verticalScan != undefined ? options.verticalScan : verticalScan;
            binaryScanning = options.binaryScanning != undefined ? options.binaryScanning : binaryScanning;
        }
        thiz.addSelectKeyCode(options.selectKeyCode);
        thiz.addSelectKey(options.selectKey);
        if (_keydownEventListeners.length == 0) {
            thiz.addSelectKeyCode(32); //space as default key
        }
    }

    function getGroups(allElements, verticalScan) {
        var minPosFn = verticalScan ? getPosXMin : getPosYMin;
        var maxPosFn = verticalScan ? getPosXMax : getPosYMax;
        var sortFn = function (a, b) {
            var sizeA = maxPosFn(a) - minPosFn(a);
            var sizeB = maxPosFn(b) - minPosFn(b);
            var diff = minPosFn(a) - minPosFn(b);
            diff = diff != 0 ? diff : sizeB - sizeA; // same min-positions should be ordered by size, bigger sizes first
            diff = diff != 0 ? diff : (a.id && b.id ? a.id.localeCompare(b.id) : 0); // same min-positions should be ordered by size, bigger sizes first
            return diff != 0 ? diff : sizeB - sizeA;
        };
        allElements = allElements.sort(sortFn);
        var remainingElements = allElements.slice();
        var groups = [];
        var i = 0;
        while (remainingElements.length > 0 && i < 1000) {
            i++; //endless loop protection
            var group = getNextGroup(remainingElements, allElements, verticalScan);
            groups.push(group);
            remainingElements = remainingElements.filter(el => !group.includes(el));
        }
        return groups;
    }

    function getNextGroup(remainingElements, allElements, verticalScan) {
        var minPosFn = verticalScan ? getPosXMin : getPosYMin;
        var maxPosFn = verticalScan ? getPosXMax : getPosYMax;
        var firstElem = remainingElements[0];
        var firstMinPos = minPosFn(firstElem);
        var firstMaxPos = maxPosFn(firstElem);
        var allowDuplicated = false;
        var compareElements = allowDuplicated ? allElements : remainingElements;
        var group = compareElements.filter(item =>
            firstMinPos >= minPosFn(item) && firstMinPos <= maxPosFn(item) ||  //minimum of first value is inbetween the size of the item
            minPosFn(item) <= firstMaxPos && maxPosFn(item) >= firstMaxPos ||  //maximum of first value is inbetween the size of the item
            minPosFn(item) >= firstMinPos && maxPosFn(item) <= firstMaxPos     //item is completely wrapped by first item
        );
        return group;
    }

    function getPosYMin(item) {
        return item.getBoundingClientRect().top;
    }

    function getPosYMax(item) {
        return item.getBoundingClientRect().bottom;
    }

    function getPosXMin(item) {
        return item.getBoundingClientRect().left;
    }

    function getPosXMax(item) {
        return item.getBoundingClientRect().right;
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
        L.removeClass(itemSelector, 'first');
        L.addClass(itemSelector, scanInactiveClass);

        if (_isScanning) {
            L.addClass(elems[index], scanActiveClass);
            L.addClass(elems[index][0][0], 'first');
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
            var rows = getGroups(elements, verticalScan);
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

    thiz.updateOptions = function (options, restartIfRunning) {
        if (restartIfRunning) {
            thiz.pauseScanning();
        }
        parseOptions(options);
        if (restartIfRunning) {
            thiz.resumeScanning();
        }
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

    thiz.addSelectKeyCode = function (keyCode) {
        if (keyCode) {
            var fn = function (event) {
                if (event.keyCode == keyCode && _isScanning) {
                    event.preventDefault();
                    thiz.select();
                }
            };
            document.addEventListener("keydown", fn);
            _keydownEventListeners.push(fn);
        }
    };

    thiz.addSelectKey = function (character) {
        var keyCode = L.convertToKeyCode(character);
        thiz.addSelectKeyCode(keyCode);
    };

    thiz.clearSelectKeys = function () {
        _keydownEventListeners.forEach(function (fn) {
            document.removeEventListener("keydown", fn);
        });
        _keydownEventListeners = [];
    };

    init();
}

export {Scanner};
import {L} from "../../lib/lquery.js";

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
    var touchScanning = true;

    //internal
    var _selectionListener = null;
    var _isScanning = false;
    var _currentActiveScanElements = null;
    var _scanTimeoutHandler = null;
    var _layoutChangeTimeoutHandler = null;
    var _scanningPaused = false;
    var _keydownEventListeners = [];
    var _touchListener = null;

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
            touchScanning = options.touchScanning != undefined ? options.touchScanning : touchScanning;
        }
        if(touchScanning) thiz.enableTouchScanning();
        thiz.addSelectKeyCode(options.selectKeyCode);
        thiz.addSelectKey(options.selectKey);
        if (_keydownEventListeners.length == 0) {
            thiz.addSelectKeyCode(32); //space as default key
        }
    }

    function getGroups(allElements, verticalScan) {
        var minPosFn = verticalScan ? getPosXMin : getPosYMin;
        var maxPosFn = verticalScan ? getPosXMax : getPosYMax;
        var invertedMinPosFn = !verticalScan ? getPosXMin : getPosYMin;
        var sortFnGroupSplitting = getCombinedSortFunction(getPosSortFunction(minPosFn), getSizeSortFunction(minPosFn, maxPosFn), getIdSortFunction());
        var sortFnOneGroup = getCombinedSortFunction(getPosSortFunction(invertedMinPosFn), getPosSortFunction(minPosFn));
        allElements = allElements.sort(sortFnGroupSplitting);
        var remainingElements = allElements.slice();
        var groups = [];
        var i = 0;
        while (remainingElements.length > 0 && i < 1000) {
            i++; //endless loop protection
            var group = getNextGroup(remainingElements, allElements, verticalScan);
            groups.push(group);
            remainingElements = remainingElements.filter(el => !group.includes(el));
        }
        groups = refineGroups(groups);
        groups.forEach(group => group.sort(sortFnOneGroup));
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

    /**
     * adds element of groups with only 1 element to neighbor group, and removes 1 element groups afterwards.
     * input: [group(5), group(1), group(2), group(4), group(1), group(3), group(3), group(1)]
     * output: [group(5), group(3), group(4), group(4), group(4)]
     *
     * @param groups
     */
    function refineGroups(groups) {
        var groupsToRemove = [];
        for (var i = 0; i < groups.length; i++) {
            var group = groups[i];
            var lastGroup = null;
            var nextGroup = null;
            if (i - 1 >= 0) lastGroup = groups[i - 1];
            if (i + 1 < groups.length) nextGroup = groups[i + 1];
            if (group.length == 1) {
                var addToLastGroup = !nextGroup || (lastGroup && nextGroup && lastGroup.length < nextGroup.length);
                var groupToAdd = addToLastGroup ? lastGroup : nextGroup;
                if(groupToAdd) {
                    group.forEach(function (item) {
                        groupToAdd.push(item);
                    });
                    groupsToRemove.push(group);
                }
            }
        }
        return groups.filter(group => !groupsToRemove.includes(group));
    }


    /**
     * returns a function that can be passed to Array.sort() for sorting an array.
     * elements with a smallest position value evaluated by the given 'posFunction' are sorted to first places
     *
     * @param posFunction
     * @return {Function}
     */
    function getPosSortFunction(posFunction) {
        return function (a, b) {
            return posFunction(a) - posFunction(b);
        }
    }

    /**
     * returns a function that can be passed to Array.sort() for sorting an array.
     * elements with biggest size according to the osition values evaluated by the given 'minPosFn' and
     * 'maxPosFn' functions are sorted to first places.
     *
     * @param minPosFn function that evaluates to the minimum position (e.g. most left position) of an element
     * @param maxPosFn function that evaluates to the maximum position (e.g. most right position) of an element
     * @return {Function}
     */
    function getSizeSortFunction(minPosFn, maxPosFn) {
        return function (a, b) {
            var sizeA = Math.abs(maxPosFn(a) - minPosFn(a));
            var sizeB = Math.abs(maxPosFn(b) - minPosFn(b));
            return sizeB - sizeA;
        }
    }

    /**
     * returns a function that can be passed to Array.sort() for sorting an array.
     * elements are sorted by the id property, if available
     *
     * @return {Function}
     */
    function getIdSortFunction() {
        return function (a, b) {
            if (a.id) {
                return a.id.localeCompare(b.id);
            } else if (b.id) {
                return b.id.localeCompare(a.id) * -1;
            }
            return 0;
        };
    }

    /**
     * returns a function that can be passed to Array.sort() for sorting an array.
     * combines several sort functions that are passed as arguments. First passed functions have higher priority. If
     * one of them evaluates to a value != 0, this value will be returned by the combined sort function.
     *
     * @return {Function}
     */
    function getCombinedSortFunction() {
        var args = arguments;
        return function (a, b) {
            for (var i = 0; i < args.length; i++) {
                if (L.isFunction(args[i])) {
                    var result = args[i](a, b);
                    if (result !== 0) {
                        return result;
                    }
                }
            }
            return 0;
        };

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
            var rows = getGroups(elements, verticalScan);
            _isScanning = true;
            if(rows.length == 1) {
                scan(spitToSubarrays(L.flattenArray(rows)));
            } else {
                scan(spitToSubarrays(rows));
            }
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

    thiz.enableTouchScanning = function () {
        if(!_touchListener) {
            _touchListener = function () {
                thiz.select();
            };
            L('#grid-container').addEventListener("touchstart", _touchListener);
        }
    };

    thiz.disableTouchScanning = function () {
        if(_touchListener) {
            L('#grid-container').removeEventListener("touchstart", _touchListener);
            _touchListener = null;
        }
    };
    init();
}

export {Scanner};
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./static/js/mainScript.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./static/js/hovering.js":
/*!*******************************!*\
  !*** ./static/js/hovering.js ***!
  \*******************************/
/*! exports provided: Hover */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Hover\", function() { return Hover; });\n/* harmony import */ var _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/lquery.js */ \"./static/lib/lquery.js\");\n\n\nfunction Hover(itemSelector, hoverActiveClass) {\n    var thiz = this;\n    var _itemSelector = itemSelector;\n    var _hoverActiveClass = hoverActiveClass;\n    var _hoverTimeoutMs = 1000;\n    var _selectionListener = null;\n    var _isHovering = false;\n    var _hoverMap = {};\n\n    function mouseEnter(event) {\n        _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].addClass(this, 'mouseentered');\n        _hoverMap[event.target] = setTimeout(function () {\n            if (_selectionListener) {\n                _selectionListener(event.target);\n            }\n        }, _hoverTimeoutMs);\n    }\n\n    function mouseLeave(event) {\n        _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].removeClass(this, 'mouseentered');\n        clearTimeout(_hoverMap[event.target]);\n    }\n\n    thiz.startHovering = function () {\n        _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].selectAsList(_itemSelector).forEach(function (item) {\n            item.addEventListener('mouseenter', mouseEnter);\n            item.addEventListener('mouseleave', mouseLeave);\n        });\n    };\n\n    thiz.stopHovering = function () {\n        _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].selectAsList(_itemSelector).forEach(function (item) {\n            item.removeEventListener('mouseenter', mouseEnter);\n            item.removeEventListener('mouseleave', mouseLeave);\n        });\n    };\n\n    thiz.setHoverTimeout = function (timeoutMs) {\n        _hoverTimeoutMs = timeoutMs;\n    };\n\n    thiz.setSelectionListener = function (fn) {\n        _selectionListener = fn;\n    };\n}\n\n\n\n//# sourceURL=webpack:///./static/js/hovering.js?");

/***/ }),

/***/ "./static/js/mainScript.js":
/*!*********************************!*\
  !*** ./static/js/mainScript.js ***!
  \*********************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/lquery.js */ \"./static/lib/lquery.js\");\n/* harmony import */ var _templates_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./templates.js */ \"./static/js/templates.js\");\n/* harmony import */ var _scanning_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./scanning.js */ \"./static/js/scanning.js\");\n/* harmony import */ var _hovering_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./hovering.js */ \"./static/js/hovering.js\");\n\n\n\n\n\nvar scanner = new _scanning_js__WEBPACK_IMPORTED_MODULE_2__[\"Scanner\"]('.item-content', 'scanFocus', {\n    verticalScan: Object(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"])('#chkVerticalScanning').checked,\n    subScanRepeat: 3,\n    binaryScanning: Object(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"])('#chkBinaryScanning').checked,\n    scanInactiveClass: 'scanInactive'\n});\nvar hover = new _hovering_js__WEBPACK_IMPORTED_MODULE_3__[\"Hover\"]('.item-content');\n\nfor (var i = 0; i < 70; i++) {\n    Object(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"])('#grid').insertAdjacentHTML('beforeend', _templates_js__WEBPACK_IMPORTED_MODULE_1__[\"tempates\"].getGridItem(i));\n}\n\nvar grid = new Muuri('#grid', {\n    dragEnabled: true\n});\ngrid.on('dragInit', function (items) {\n    scanner.pauseScanning();\n});\ngrid.on('dragReleaseEnd', function (items) {\n    scanner.resumeScanning();\n});\n\nObject(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"])('#btnStartScan').addEventListener('click', function () {\n    scanner.startScanning();\n});\n\nObject(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"])('#btnStopScan').addEventListener('click', function () {\n    scanner.stopScanning();\n});\n\nObject(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"])('#inScanTime').addEventListener('change', function (event) {\n    scanner.updateOptions({\n        scanTimeoutMs: event.target.value\n    });\n});\n\nObject(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"])('#chkVerticalScanning').addEventListener('change', function (event) {\n    scanner.updateOptions({\n        verticalScan: event.target.checked\n    }, true);\n});\n\nObject(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"])('#chkBinaryScanning').addEventListener('change', function (event) {\n    scanner.updateOptions({\n        binaryScanning: event.target.checked\n    }, true);\n});\n\nObject(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"])('#chkHover').addEventListener('change', function (event) {\n    if (event.target.checked) {\n        hover.startHovering();\n    } else {\n        hover.stopHovering();\n    }\n});\n\nwindow.addEventListener('resize', function () {\n    scanner.layoutChanged();\n}, true);\n\nscanner.setSelectionListener(function (item) {\n    console.log('selected: ' + item);\n    _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].toggleClass(item, 'selected');\n});\n\nhover.setSelectionListener(function (item) {\n    console.log('selected: ' + item);\n    _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].toggleClass(item, 'selected');\n});\n\nscanner.startScanning();\n\n//# sourceURL=webpack:///./static/js/mainScript.js?");

/***/ }),

/***/ "./static/js/scanning.js":
/*!*******************************!*\
  !*** ./static/js/scanning.js ***!
  \*******************************/
/*! exports provided: Scanner */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Scanner\", function() { return Scanner; });\n/* harmony import */ var _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/lquery.js */ \"./static/lib/lquery.js\");\n\n\nfunction Scanner(itemSelector, scanActiveClass, options) {\n    var thiz = this;\n\n    //options\n    var itemSelector = itemSelector;\n    var scanActiveClass = scanActiveClass;\n    var scanInactiveClass = '';\n    var scanTimeoutMs = 1000;\n    var verticalScan = false;\n    var subScanRepeat = 3;\n    var minBinarySplitThreshold = 3; // for binary scanning: if there are [n] or less scanning possibilities they will not be split up again, but will be scanned in linear fashion\n    var binaryScanning = false;\n\n    //internal\n    var _selectionListener = null;\n    var _isScanning = false;\n    var _currentActiveScanElements = null;\n    var _scanTimeoutHandler = null;\n    var _layoutChangeTimeoutHandler = null;\n    var _scanningPaused = false;\n    var _keydownEventListeners = [];\n\n    function init() {\n        parseOptions(options);\n    }\n\n    function parseOptions(options) {\n        if (options) {\n            scanTimeoutMs = options.scanTimeoutMs || scanTimeoutMs;\n            subScanRepeat = options.subScanRepeat || subScanRepeat;\n            minBinarySplitThreshold = options.minBinarySplitThreshold || minBinarySplitThreshold;\n            scanInactiveClass = options.scanInactiveClass || scanInactiveClass;\n\n            verticalScan = options.verticalScan != undefined ? options.verticalScan : verticalScan;\n            binaryScanning = options.binaryScanning != undefined ? options.binaryScanning : binaryScanning;\n        }\n        thiz.addSelectKeyCode(options.selectKeyCode);\n        thiz.addSelectKey(options.selectKey);\n        if (_keydownEventListeners.length == 0) {\n            thiz.addSelectKeyCode(32); //space as default key\n        }\n    }\n\n    function getGroups(elements, groupingFn) {\n        groupingFn = groupingFn || getYPos;\n        elements = elements || [];\n        var keys = [];\n        var rows = {};\n        elements.forEach(function (item) {\n            var yPos = groupingFn(item, elements);\n            if (keys.indexOf(yPos) != -1) {\n                rows[yPos].push(item);\n            } else {\n                keys.push(yPos);\n                rows[yPos] = [item];\n            }\n        });\n        keys = keys.sort(function (a, b) {\n            return a - b;\n        });\n        return keys.map(function (key) {\n            return rows[key];\n        });\n    }\n\n    function getYPos(item) {\n        return item.getBoundingClientRect().top;\n    }\n\n    function getXPos(item) {\n        return item.getBoundingClientRect().left;\n    }\n\n    function scan(elems, index, count) {\n        elems = elems || [];\n        count = count || 0;\n        index = index || 0;\n        index = index <= elems.length - 1 ? index : 0;\n        if (count >= subScanRepeat * elems.length) {\n            thiz.restartScanning();\n            return;\n        }\n        _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].removeClass(itemSelector, scanActiveClass);\n        _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].addClass(itemSelector, scanInactiveClass);\n\n        if (_isScanning) {\n            _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].addClass(elems[index], scanActiveClass);\n            _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].removeClass(elems, scanInactiveClass);\n            _currentActiveScanElements = elems[index];\n            _scanTimeoutHandler = setTimeout(function () {\n                scan(elems, index + 1, count + 1);\n            }, scanTimeoutMs);\n        }\n    }\n\n    function spitToSubarrays(array) {\n        var returnArray = [];\n        array = array || [];\n        var chunk = 1;\n        if (binaryScanning && array.length > minBinarySplitThreshold) {\n            chunk = Math.ceil(array.length / 2);\n        }\n        for (var i = 0, j = array.length; i < j; i += chunk) {\n            var temparray = array.slice(i, i + chunk);\n            returnArray.push(temparray);\n        }\n        return returnArray;\n    }\n\n    thiz.startScanning = function () {\n        if (!_isScanning) {\n            var elements = _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].selectAsList(itemSelector);\n            var groupingFn = verticalScan ? getXPos : getYPos;\n            var rows = getGroups(elements, groupingFn);\n            _isScanning = true;\n            scan(spitToSubarrays(rows));\n        }\n    };\n\n    thiz.stopScanning = function () {\n        _isScanning = false;\n        if (_scanTimeoutHandler) {\n            clearTimeout(_scanTimeoutHandler);\n        }\n        _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].removeClass(itemSelector, scanActiveClass);\n        _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].removeClass(itemSelector, scanInactiveClass);\n    };\n\n    /**\r\n     * stops and re-starts scanning directly afterwards\r\n     */\n    thiz.restartScanning = function () {\n        thiz.stopScanning();\n        thiz.startScanning(verticalScan);\n    };\n\n    /**\r\n     * stops scanning, if it is already running. same functionality as stopScanning() with the difference that a call\r\n     * of resumeScanning() afterwards will re-start scanning while it will not if it was stopped with stopScanning().\r\n     */\n    thiz.pauseScanning = function () {\n        if (_isScanning) {\n            thiz.stopScanning();\n            _scanningPaused = true;\n        }\n    };\n\n    /**\r\n     * starts scanning if it was paused before with pauseScanning(). Does not start scanning if it never run or\r\n     * if it was stopped with stopScanning().\r\n     */\n    thiz.resumeScanning = function () {\n        if (_scanningPaused) {\n            thiz.startScanning();\n            _scanningPaused = false;\n        }\n    };\n\n    thiz.updateOptions = function (options, restartIfRunning) {\n        if (restartIfRunning) {\n            thiz.pauseScanning();\n        }\n        parseOptions(options);\n        if (restartIfRunning) {\n            thiz.resumeScanning();\n        }\n    };\n\n    /**\r\n     * sets a method that is called if an item was selected by scanning. The function will be called with the selected\r\n     * item as first parameter.\r\n     * @param fn\r\n     */\n    thiz.setSelectionListener = function (fn) {\n        if (_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].isFunction(fn)) {\n            _selectionListener = fn;\n        }\n    };\n\n    /**\r\n     * method to be called if the layout of elements changed and scanning should be restarted in order to adapt\r\n     * to new layout. If this method is called multiple times in the timeout period, restarting of scanning will\r\n     * be postponed to: [time of last call to layoutChanged()] + [timeout].\r\n     * @param timeout the timeout to wait before restarting scanning in milliseconds, default: 1000ms.\r\n     */\n    thiz.layoutChanged = function (timeout) {\n        timeout = timeout || 1000;\n        if (_isScanning) {\n            thiz.stopScanning();\n            _layoutChangeTimeoutHandler = setTimeout(function () {\n                _layoutChangeTimeoutHandler = null;\n                thiz.restartScanning();\n            }, timeout);\n        } else if (_layoutChangeTimeoutHandler) {\n            clearTimeout(_layoutChangeTimeoutHandler);\n            _layoutChangeTimeoutHandler = setTimeout(function () {\n                _layoutChangeTimeoutHandler = null;\n                thiz.restartScanning();\n            }, timeout);\n        }\n    };\n\n    /**\r\n     * method to call to select the current scan item(s). For instance it could be called inside a keyboard\r\n     * event listener.\r\n     */\n    thiz.select = function () {\n        if (_isScanning) {\n            thiz.stopScanning();\n            _isScanning = true;\n            if (_currentActiveScanElements.length > 1) {\n                scan(spitToSubarrays(_currentActiveScanElements));\n            } else if (_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].flattenArray(_currentActiveScanElements).length > 1) {\n                scan(spitToSubarrays(_lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].flattenArray(_currentActiveScanElements)));\n            } else if (_selectionListener) {\n                _selectionListener(_currentActiveScanElements[0]);\n                thiz.restartScanning();\n            }\n        }\n    };\n\n    thiz.addSelectKeyCode = function (keyCode) {\n        if (keyCode) {\n            var fn = function fn(event) {\n                if (event.keyCode == keyCode && _isScanning) {\n                    event.preventDefault();\n                    thiz.select();\n                }\n            };\n            document.addEventListener(\"keydown\", fn);\n            _keydownEventListeners.push(fn);\n        }\n    };\n\n    thiz.addSelectKey = function (character) {\n        var keyCode = _lib_lquery_js__WEBPACK_IMPORTED_MODULE_0__[\"L\"].convertToKeyCode(character);\n        thiz.addSelectKeyCode(keyCode);\n    };\n\n    thiz.clearSelectKeys = function () {\n        _keydownEventListeners.forEach(function (fn) {\n            document.removeEventListener(\"keydown\", fn);\n        });\n        _keydownEventListeners = [];\n    };\n\n    init();\n}\n\n\n\n//# sourceURL=webpack:///./static/js/scanning.js?");

/***/ }),

/***/ "./static/js/templates.js":
/*!********************************!*\
  !*** ./static/js/templates.js ***!
  \********************************/
/*! exports provided: tempates */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"tempates\", function() { return tempates; });\nvar tempates = {};\ntempates.getGridItem = function (number) {\n    var template = \"\\n<div class=\\\"item\\\">\\n    <div class=\\\"item-content\\\">\\n        <!-- Safe zone, enter your custom markup -->\\n        <div class=\\\"my-custom-content\\\">\\n            \" + number + \"\\n        </div>\\n        <!-- Safe zone ends -->\\n    </div>\\n</div>\";\n    return template;\n};\n\n\n\n//# sourceURL=webpack:///./static/js/templates.js?");

/***/ }),

/***/ "./static/lib/lquery.js":
/*!******************************!*\
  !*** ./static/lib/lquery.js ***!
  \******************************/
/*! exports provided: L */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"L\", function() { return L; });\n//very lightweight replacement for jquery,\n//see https://blog.garstasio.com/you-dont-need-jquery/selectors/#multiple-selectors\nvar L = function L(selector) {\n    if (selector instanceof Node || selector instanceof NodeList || selector instanceof Array) {\n        return selector;\n    }\n    var selectorType = 'querySelectorAll';\n\n    if (selector.indexOf('#') === 0) {\n        selectorType = 'getElementById';\n        selector = selector.substr(1, selector.length);\n    }\n\n    return document[selectorType](selector);\n};\n\nL.toggle = function () {\n    var args = Array.prototype.slice.call(arguments);\n    args.unshift(\"block\");\n    toggleInternal(args);\n};\n\nL.toggleInline = function () {\n    var args = Array.prototype.slice.call(arguments);\n    args.unshift(\"inline\");\n    toggleInternal(args);\n};\n\nfunction toggleInternal(args) {\n    var displayModeShown = args[0];\n    if (!args || args.length < 2) {\n        return;\n    }\n    for (var i = 1; i < args.length; i++) {\n        var selector = args[i];\n        var elems = L.selectAsList(selector);\n        elems.forEach(function (x) {\n            if (x.style && x.style.display === \"none\") {\n                x.style.display = displayModeShown;\n            } else {\n                x.style.display = \"none\";\n            }\n        });\n    }\n}\n\nL.isVisible = function (selector) {\n    var x = L(selector);\n    return !(x.style && x.style.display === \"none\");\n};\n\nL.setVisible = function (selector, visible, visibleClass) {\n    var elems = L.selectAsList(selector);\n    elems.forEach(function (x) {\n        if (visible == false) {\n            x.style.display = \"none\";\n        } else {\n            x.style.display = visibleClass ? visibleClass : \"block\";\n        }\n    });\n};\n\nL.selectAsList = function (selector) {\n    var result = L(selector);\n    if (result instanceof Array) {\n        return L.flattenArrayDeep(result);\n    } else if (result instanceof NodeList) {\n        return Array.prototype.slice.call(result); //convert NodeList to Array\n    }\n    return [result];\n};\n\nL.addClass = function (selector, className) {\n    var list = L.selectAsList(selector);\n    list.forEach(function (elem) {\n        if (!elem.classList.contains(className)) {\n            elem.classList.add(className);\n        }\n    });\n};\n\nL.removeClass = function (selector, className) {\n    var list = L.selectAsList(selector);\n    list.forEach(function (elem) {\n        elem.classList.remove(className);\n    });\n};\n\nL.toggleClass = function (selector, className) {\n    var list = L.selectAsList(selector);\n    list.forEach(function (elem) {\n        if (elem.classList.contains(className)) {\n            elem.classList.remove(className);\n        } else {\n            elem.classList.add(className);\n        }\n    });\n};\n\nL.setSelected = function (selector, selected) {\n    if (selected == undefined) selected = true;\n    var list = L.selectAsList(selector);\n    list.forEach(function (elem) {\n        if (selected) {\n            L.addClass(elem, 'selected');\n        } else {\n            L.removeClass(elem, 'selected');\n        }\n        elem.setAttribute('aria-selected', selected);\n    });\n};\n\nL.setValue = function (selector, value) {\n    var list = L.selectAsList(selector);\n    list.forEach(function (elem) {\n        if (elem.value) {\n            elem.value = value;\n        }\n    });\n};\n\nL.hasFocus = function (selector) {\n    return L(selector) == document.activeElement;\n};\n\nL.val2key = function (val, array) {\n    for (var key in array) {\n        if (array[key] == val) {\n            return key;\n        }\n    }\n    return false;\n};\n\nL.isFunction = function (functionToCheck) {\n    var getType = {};\n    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';\n};\n\nL.getIDSelector = function (id) {\n    return '#' + id;\n};\n\nL.getPercentage = function (value, minRange, maxRange) {\n    return Math.round((value - minRange) / (maxRange - minRange) * 100 * 1000) / 1000;\n};\n\nL.getMs = function () {\n    return new Date().getTime();\n};\n\nL.deepCopy = function (object) {\n    return JSON.parse(JSON.stringify(object));\n};\n\nL.removeAllChildren = function (selector) {\n    var elm = L(selector);\n    elm = elm instanceof NodeList ? elm : [elm];\n    elm.forEach(function (elem) {\n        while (elem.firstChild) {\n            elem.removeChild(elem.firstChild);\n        }\n    });\n};\n\nL.createElement = function (tagName, className, inner) {\n    var e = document.createElement(tagName);\n    e.className = className;\n    if (inner) {\n        inner = inner instanceof Array ? inner : [inner];\n        inner.forEach(function (innerElem) {\n            if (typeof innerElem === 'string') {\n                e.innerHTML += innerElem;\n            } else {\n                e.appendChild(innerElem);\n            }\n        });\n    }\n\n    return e;\n};\n\n/**\r\n * creates a list of <option> elements as innerHTML for an <select> element.\r\n *\r\n * @param listValues the list of values for the <option> elements\r\n * @param listHtml a list of values for the innerHTML of the <option> elements, if a function it is used to translate a\r\n * value from the listValues, if not specified L.translate() is used to generate the innerHTML of the option elements.\r\n * @param defaultOption if specified a default option with the given innerHTML (or its translation) and value \"-1\" is added\r\n * @return {string}\r\n */\nL.createSelectItems = function (listValues, listHtml, defaultOption) {\n    var result = '';\n    var hasHtml = listHtml && listHtml.length == listValues.length;\n    var hasHtmlFn = L.isFunction(listHtml);\n\n    for (var i = 0; i < listValues.length; i++) {\n        var html = hasHtmlFn ? listHtml(listValues[i]) : hasHtml ? listHtml[i] : L.translate(listValues[i]);\n        var elem = L.createElement('option', '', html);\n        elem.value = listValues[i];\n        result += elem.outerHTML + '\\n';\n    }\n\n    if (defaultOption) {\n        result = '<option value=\"-1\" disabled selected hidden>' + L.translate('SELECT_SPECIAL_KEY') + '</option>\\n' + result;\n    }\n    return result;\n};\n\n/**\r\n * returns true if the current browser language contains the given localeString\r\n */\nL.isLang = function (localeString) {\n    var lang = navigator.userLanguage || navigator.language;\n    return lang.indexOf(localeString) > -1;\n};\n\nL.getLang = function () {\n    var lang = navigator.userLanguage || navigator.language;\n    return lang.substring(0, 2);\n};\n\n/**\r\n * translates an translation key. More arguments can be passed in order to replace placeholders (\"{?}\") in the translated texts.\r\n * e.g.\r\n * var key = 'SAY_HELLO_KEY'\r\n * translation: 'SAY_HELLO_KEY' -> 'Hello {?} {?}'\r\n * L.translate(key, 'Tom', 'Mayer') == 'Hello Tom Mayer'\r\n *\r\n * @param translationKey the key to translate\r\n * @return {*}\r\n */\nL.translate = function (translationKey) {\n    var translated = i18n[translationKey] ? i18n[translationKey] : translationKey;\n    for (var i = 1; i < arguments.length; i++) {\n        translated = translated.replace('{?}', arguments[i]);\n    }\n    return translated;\n};\n\nL.getLastElement = function (array) {\n    return array.slice(-1)[0];\n};\n\nL.replaceAll = function (string, search, replace) {\n    return string.replace(new RegExp(search, 'g'), replace);\n};\n\nL.equalIgnoreCase = function (str1, str2) {\n    return str1.toUpperCase() === str2.toUpperCase();\n};\n\nL.loadScript = function (source, fallbackSource) {\n    console.log(\"loading script: \" + source);\n    var script = document.createElement('script');\n    return new Promise(function (resolve) {\n        script.onload = function () {\n            console.log(\"loaded: \" + source);\n            resolve(true);\n        };\n        script.onerror = function () {\n            console.log(\"error loading: \" + source);\n            if (fallbackSource) {\n                L.loadScript(fallbackSource).then(resolve);\n            } else {\n                resolve(false);\n            }\n        };\n        script.src = source;\n        document.head.appendChild(script);\n    });\n};\n\nL.flattenArray = function (array) {\n    return [].concat.apply([], array);\n};\n\nL.flattenArrayDeep = function (arr) {\n    return arr.reduce(function (acc, e) {\n        return Array.isArray(e) ? acc.concat(L.flattenArrayDeep(e)) : acc.concat(e);\n    }, []);\n};\n\nL.convertToKeyCode = function (character) {\n    if (/^[a-zA-Z0-9]$/.test(character)) {\n        return character.toUpperCase().charCodeAt(0);\n    }\n    return null;\n};\n\nwindow.L = L; //make also global for usage in browser console\n\n\n//# sourceURL=webpack:///./static/lib/lquery.js?");

/***/ })

/******/ });
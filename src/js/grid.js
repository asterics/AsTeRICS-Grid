import $ from 'jquery';
import {dataService} from "./service/dataService";
import {GridData} from "./model/GridData";
import {GridElement} from "./model/GridElement";
import {templates} from "./templates";

function Grid(gridContainerId, gridItemClass, options) {
    var thiz = this;

    //options
    var gridContainerId = gridContainerId;
    var gridItemClass = gridItemClass;
    var enableResizing = false;
    var gridId = null;

    //internal
    var _gridListInstance = null;
    var _gridElement = null;
    var _layoutChangedStartListener = null;
    var _layoutChangedEndListener = null;
    var _animationTimeMs = 200; //see gridlist.css
    var _gridData = null;
    var _gridRows = null;
    var _initPromise = null;

    function init() {
        _initPromise = new Promise(resolve => {
            initData(options).then(() => {
                initGrid();
                initResizing();
                setTimeout(() => resolve(), _animationTimeMs); // resolve with timeout in order to wait for init-animation, only resolve if grid is stable.
            });
        });
    }

    function initData(options) {
        return new Promise(resolve => {
            if (options) {
                gridId = options.gridId || gridId;
                enableResizing = options.enableResizing != undefined ? options.enableResizing : enableResizing;
            }
            dataService.getGrid(gridId).then(gridData => {
                _gridData = gridData;
                _gridRows = _gridData.rowCount;
                resolve();
            });
        });

    }

    function initGrid() {
        $(gridContainerId).append(templates.getGridBase(_gridData.id));
        _gridElement = $('#' + _gridData.id);
        _gridData.gridElements.forEach(function (gridElement) {
            _gridElement.append(gridElement.toHTML());
        });

        _gridElement.gridList({
            lanes: _gridRows,
            widthHeightRatio: 1,
            heightToFontSizeRatio: 0.25,
        }, {
            start: notifyLayoutChangeStart,
            stop: notifyLayoutChangeEnd
        });
        _gridListInstance = _gridElement.data('_gridList');
        if (!_gridData.hasSetPositions()) {
            _gridElement.gridList('resize', _gridRows);
        }
    }

    function initResizing() {
        $(gridItemClass).resizable(getResizeOptions());

        $(window).resize(function () {
            _gridElement.gridList('reflow');
        });
    }

    function refreshResizeOptions() {
        $(gridItemClass).resizable('option', getResizeOptions());
    }

    function getResizeOptions() {
        var itemSize = _gridListInstance._cellWidth;
        return {
            grid: [itemSize, itemSize],
            autoHide: true,
            handles: 'se',
            disabled: !enableResizing,
            start: notifyLayoutChangeStart,
            stop: notifyLayoutChangeEnd,
            resize: function (event, ui) {
                ui.element.parent().css('z-index', 1);
                var w = Math.round(ui.element.width() / (itemSize));
                var h = Math.round(ui.element.height() / (itemSize));
                _gridElement.gridList('resizeItem', ui.element.parent(), {
                    w: w,
                    h: h
                });
                ui.element.css('height', '');
                ui.element.css('width', '');
            }
        };
    }

    function notifyLayoutChangeStart() {
        if ($.isFunction(_layoutChangedStartListener)) {
            _layoutChangedStartListener();
        }
    }

    function notifyLayoutChangeEnd() {
        if ($.isFunction(_layoutChangedEndListener)) {
            setTimeout(function () {
                _layoutChangedEndListener();
            }, _animationTimeMs);
        }
        _gridData.gridElements = thiz.toGridElements();
        dataService.updateGrid(thiz.getCurrentGridId(), {
            gridElements: _gridData.gridElements,
            rowCount: _gridRows
        });
    }

    thiz.enableElementResizing = function () {
        $(gridItemClass).resizable("enable");
    };

    thiz.disableElementResizing = function () {
        $(gridItemClass).resizable("disable");
    };

    thiz.addRow = function () {
        notifyLayoutChangeStart();
        _gridRows++;
        _gridElement.gridList('resize', _gridRows);
        notifyLayoutChangeEnd();
    };

    thiz.removeRow = function () {
        notifyLayoutChangeStart();
        if (_gridRows > 1) {
            _gridRows--;
            _gridElement.gridList('resize', _gridRows);
        }
        notifyLayoutChangeEnd();
    };

    thiz.setNumberOfRows = function (nr) {
        notifyLayoutChangeStart();
        nr = Number.parseInt(nr);
        if (nr && nr > 0) {
            _gridRows = nr;
            _gridElement.gridList('resize', _gridRows);
        }
        notifyLayoutChangeEnd();
    };

    thiz.setLayoutChangedStartListener = function (fn) {
        _layoutChangedStartListener = fn;
    };

    thiz.setLayoutChangedEndListener = function (fn) {
        _layoutChangedEndListener = fn;
    };

    thiz.getCurrentGridId = function () {
        return _gridData.id;
    };

    thiz.toGridElements = function () {
        var gridElements = [];
        _gridListInstance.items.forEach(function (item) {
            var id = item.$element.attr('data-id');
            var label = item.$element.attr('data-label');
            gridElements.push(new GridElement({
                id: id,
                label: label,
                width: item.w,
                height: item.h
            }, item));
        });
        return gridElements;
    };

    thiz.getInitPromise = function () {
        return _initPromise;
    };

    init();
}

export {Grid};
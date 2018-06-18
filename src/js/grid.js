import $ from 'jquery';
import {dataService} from "./service/dataService";
import {GridData} from "./model/GridData";

function Grid(gridSelector, gridItemClass, options) {
    var thiz = this;

    //options
    var gridSelector = gridSelector;
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

    function init() {
        initData(options);
        initGrid();
        initResizing();
    }

    function initData(options) {
        if (options) {
            gridId = options.gridId || gridId;
            enableResizing = options.enableResizing != undefined ? options.enableResizing : enableResizing;
        }
        _gridData = dataService.getGrid(gridId);
        _gridRows = _gridData.rowCount;
    }

    function initGrid() {
        _gridElement = $(gridSelector);
        _gridData.gridElements.forEach(function (gridElement) {
            $(gridSelector).append(gridElement.toHTML());
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
        if(!_gridData.hasSetPositions()) {
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
        if($.isFunction(_layoutChangedStartListener)) {
            _layoutChangedStartListener();
        }
    }

    function notifyLayoutChangeEnd() {
        if($.isFunction(_layoutChangedEndListener)) {
            setTimeout(function(){
                _layoutChangedEndListener();
            }, _animationTimeMs);
        }
        dataService.saveGrid(GridData.fromGridListInstance(_gridListInstance.gridList));
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

    init();
}

export {Grid};
import $ from 'jquery';
import {dataService} from "./service/dataService";
import {GridData} from "./model/GridData";

function Grid(gridSelector, gridItemClass, options) {
    var thiz = this;

    //options
    var gridSelector = gridSelector;
    var gridItemClass = gridItemClass;
    var gridRows = 9;
    var enableResizing = false;

    //internal
    var _gridListInstance = null;
    var _gridElement = null;
    var _layoutChangedStartListener = null;
    var _layoutChangedEndListener = null;
    var _animationTimeMs = 200; //see gridlist.css
    var _gridData = null;

    function init() {
        parseOptions(options);
        initGrid();
        initResizing();
    }

    function parseOptions(options) {
        if (options) {
            gridRows = options.gridRows || gridRows;
            enableResizing = options.enableResizing != undefined ? options.enableResizing : enableResizing;
        }
    }

    function initGrid() {
        _gridElement = $(gridSelector);
        _gridData = dataService.getGrid();
        _gridData.gridElements.forEach(function (gridElement) {
            $(gridSelector).append(gridElement.toHTML());
        });

        _gridElement.gridList({
            lanes: gridRows,
            widthHeightRatio: 1,
            heightToFontSizeRatio: 0.25,
        }, {
            start: notifyLayoutChangeStart,
            stop: notifyLayoutChangeEnd
        });
        _gridListInstance = _gridElement.data('_gridList');
        if(!_gridData.hasSetPositions()) {
            _gridElement.gridList('resize', gridRows);
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
        gridRows++;
        _gridElement.gridList('resize', gridRows);
        notifyLayoutChangeEnd();
    };

    thiz.removeRow = function () {
        notifyLayoutChangeStart();
        if (gridRows > 1) {
            gridRows--;
            _gridElement.gridList('resize', gridRows);
        }
        notifyLayoutChangeEnd();
    };

    thiz.setNumberOfRows = function (nr) {
        notifyLayoutChangeStart();
        if (nr && nr > 0) {
            gridRows = nr;
            _gridElement.gridList('resize', gridRows);
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

    /*thiz.toJSON = function () {
        if(_gridListInstance && _gridListInstance.gridList && _gridListInstance.gridList.items) {
            var elements = [];
            _gridListInstance.gridList.items.forEach(function (item) {
                elements.push(new GridElement().from);
            });
        }
    };*/

    init();
}

export {Grid};
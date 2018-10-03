import $ from 'jquery';
import {dataService} from "./service/dataService";
import {GridData} from "./model/GridData";
import {GridElement} from "./model/GridElement";
import {templates} from "./templates";
import {GridImage} from "./model/GridImage";
import {imageUtil} from "./util/imageUtil";
import {fontUtil} from "./util/fontUtil";

function Grid(gridContainerId, gridItemClass, options) {
    var thiz = this;

    //options
    var gridContainerId = gridContainerId;
    var gridItemClass = gridItemClass;
    var enableResizing = false;
    var dragAndDrop = false;
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
    var _undoGridDataStack = [];
    var _redoGridDataStack = [];
    var _redoGridDataStackBackup = [];

    function init(gridDataParam) {
        _initPromise = new Promise(resolve => {
            if (gridDataParam) {
                initData(options, gridDataParam);
                initGrid(_gridData);
                setTimeout(() => resolve(), _animationTimeMs); // resolve with timeout in order to wait for init-animation, only resolve if grid is stable.
            } else {
                dataService.getGrid(options.gridId).then(gridData => {
                    initData(options, gridData);
                    initGrid(_gridData);
                    setTimeout(() => resolve(), _animationTimeMs); // resolve with timeout in order to wait for init-animation, only resolve if grid is stable.
                });
            }
        });
        return _initPromise;
    }

    function initData(options, gridData) {
        if (options) {
            gridId = options.gridId || gridId;
            enableResizing = options.enableResizing != undefined ? options.enableResizing : enableResizing;
            dragAndDrop = options.dragAndDrop;
        }
        _gridData = gridData;
        _gridRows = _gridData.rowCount;
    }

    function initGrid(gridDataParam) {
        $(gridContainerId).empty();
        $(gridContainerId).append(templates.getGridBase(gridDataParam.id));
        _gridElement = $('#' + gridDataParam.id);
        gridDataParam.gridElements.forEach(function (gridElement) {
            _gridElement.append(gridElement.toHTML());
        });

        _gridElement.gridList({
            lanes: _gridRows,
            widthHeightRatio: 1,
            heightToFontSizeRatio: 0.25,
            dragAndDrop: dragAndDrop
        }, {
            start: notifyLayoutChangeStart,
            stop() {
                notifyLayoutChangeEnd();
            }
        });
        _gridListInstance = _gridElement.data('_gridList');
        if (!gridDataParam.hasSetPositions()) {
            _gridElement.gridList('resize', _gridRows);
            _gridData.gridElements = thiz.toGridElements();
            dataService.updateGrid(_gridData.id, _gridData);
        }
        initResizing();
    }

    function initResizing() {
        $(gridItemClass).resizable(getResizeOptions());

        window.addEventListener('resize', function () {
            thiz.autosize();
        })
    }

    function refreshResizeOptions() {
        $(gridItemClass).resizable('option', getResizeOptions());
    }

    function getResizeOptions() {
        var itemNormHeight = _gridListInstance._cellHeight;
        var itemNormWidth = _gridListInstance._cellWidth;
        return {
            //grid: [itemNormWidth, itemNormHeight],
            autoHide: false,
            handles: 'se',
            disabled: !enableResizing,
            start: notifyLayoutChangeStart,
            stop(event, ui) {
                var el = ui.element.parent();
                var idOfChangedElement = ui.element.attr('id');
                var resizePromise = new Promise(resolve => {
                    var imageId = el.attr('data-img-id');
                    if (imageId) {
                        dataService.getImage(imageId).then(gridImage => {
                            var elementW = $('#' + idOfChangedElement)[0].getBoundingClientRect().width;
                            imageUtil.convertBase64(gridImage.data, elementW).then(convertedBase64 => {
                                el.attr('data-img', convertedBase64);
                                el.children().children()[0].style.backgroundImage = 'url("' + convertedBase64 + '")';
                                resolve();
                            });
                        });
                    } else {
                        resolve();
                    }
                });

                resizePromise.then(() => {
                    notifyLayoutChangeEnd();
                });
            },
            resize: function (event, ui) {
                var el = ui.element.parent();
                el.css('z-index', 1);
                var w = Math.max(Math.round(ui.element.width() / itemNormWidth), 1);
                var h = Math.max(Math.round(ui.element.height() / itemNormHeight), 1);
                h = h <= _gridRows ? h : _gridRows;
                fontUtil.adaptFontSize(el);
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
            _layoutChangedStartListener(_gridData);
        }
        _undoGridDataStack.push(JSON.parse(JSON.stringify(_gridData)));
        _redoGridDataStackBackup = _redoGridDataStack;
        _redoGridDataStack = [];
    }

    function notifyLayoutChangeEnd(afterUndoOrRedo) {
        var newGridData = new GridData({
            gridElements: thiz.toGridElements(),
            rowCount: _gridRows
        }, _gridData);
        var lastGridData = _undoGridDataStack[_undoGridDataStack.length - 1];
        if (!afterUndoOrRedo && _undoGridDataStack.length > 0 && newGridData.isEqual(lastGridData)) {
            _undoGridDataStack.pop();
            _redoGridDataStack = _redoGridDataStackBackup;
            return;
        }

        dataService.updateGrid(thiz.getCurrentGridId(), newGridData).then(() => {
            dataService.getGrid(_gridData.id).then(gridData => {
                _gridData = gridData;
            });
            thiz.autosize();
            if ($.isFunction(_layoutChangedEndListener)) {
                setTimeout(function () {
                    _layoutChangedEndListener(_gridData);
                }, _animationTimeMs);
            }
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

    /**
     * removes an element by id.
     * fist it is removed from the UI grid and afterwards from the database.
     * The returned promise resolves to the updated GridData object.
     *
     * @param idToRemove
     * @return {Promise}
     */
    thiz.removeElement = function (idToRemove) {
        notifyLayoutChangeStart();

        //remove in UI
        _gridListInstance.gridList.items = _gridListInstance.gridList.items.filter(item => item.$element.children()[0].id != idToRemove);
        _gridListInstance.items = _gridListInstance.gridList.items;
        _gridListInstance.$items = $(_gridListInstance.gridList.items.map(item => item.$element[0]));
        $('#' + idToRemove).remove();

        return new Promise(resolve => {
            notifyLayoutChangeEnd();
            resolve(_gridData);
        });

    };

    thiz.duplicateElement = function (id) {
        notifyLayoutChangeStart();
        var duplicatedElement = _gridData.gridElements.filter(el => el.id == id)[0].duplicate();
        _gridData.gridElements.push(duplicatedElement);
        var newElemId = duplicatedElement.id;
        init(_gridData).then(() => {
            _gridListInstance.resolveCollisions(newElemId);
            notifyLayoutChangeEnd();
        });
    };

    /**
     * reloads the grid with updated data from dataService.
     * useful for applying changes made e.g. in label oder image of an element
     */
    thiz.reinit = function () {
        notifyLayoutChangeStart();
        init().then(() => {
            notifyLayoutChangeEnd();
        });
    };

    /**
     * does automatic positioning of elements + resizing horizontal and vertical
     */
    thiz.autosize = function () {
        _gridElement.gridList('autosize');
        setTimeout(function () {
            fontUtil.adaptFontSizeForGridElements();
        }, _animationTimeMs);
        refreshResizeOptions();
    };

    /**
     * tries to fill gaps in the layout by pulling all items to the left
     */
    thiz.fillGaps = function () {
        notifyLayoutChangeStart();
        _gridElement.gridList('fillGaps');
        notifyLayoutChangeEnd();
    };

    /**
     * compacts the layout (no gaps, in a matrix with the given amount rows)
     */
    thiz.compactLayout = function () {
        notifyLayoutChangeStart();
        _gridElement.gridList('resize', _gridRows);
        notifyLayoutChangeEnd();
    };

    /**
     * reverts the last layout change, if there was one
     */
    thiz.undo = function () {
        if (_undoGridDataStack.length > 0) {
            _redoGridDataStack.push(JSON.parse(JSON.stringify(_gridData)));
            _gridData = new GridData(_undoGridDataStack.pop());
            init(_gridData);
            notifyLayoutChangeEnd(true);
        }

    };

    /**
     * reverts the last undo, if there was one
     */
    thiz.redo = function () {
        if (_redoGridDataStack.length > 0) {
            _undoGridDataStack.push(JSON.parse(JSON.stringify(_gridData)));
            _gridData = new GridData(_redoGridDataStack.pop());
            init(_gridData);
            notifyLayoutChangeEnd(true);
        }

    };

    thiz.canUndo = () => {
        return _undoGridDataStack.length > 0;
    };

    thiz.canRedo = () => {
        return _redoGridDataStack.length > 0;
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
            var img = item.$element.attr('data-img');
            var imgId = item.$element.attr('data-img-id');
            var imageObject = imgId ? new GridImage({id: imgId, data: img}) : null;
            gridElements.push(new GridElement({
                id: id,
                label: label,
                width: item.w,
                height: item.h,
                image: imageObject
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
import $ from 'jquery';
import {dataService} from "./service/data/dataService";
import {collectElementService} from "./service/collectElementService";
import {UndoService} from "./service/data/undoService";
import {GridData} from "./model/GridData";
import {templates} from "./templates";
import {imageUtil} from "./util/imageUtil";
import {fontUtil} from "./util/fontUtil";
import {predictionService} from "./service/predictionService";
import {constants} from "./util/constants";

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
    var _undoService = new UndoService();
    let _isInitialized = false;

    function init(gridDataParam) {
        _isInitialized = false;
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
        _initPromise.then(() => {
            _isInitialized = true;
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
        collectElementService.initWithElements(_gridData.gridElements);
        predictionService.initWithElements(_gridData.gridElements);
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
            stop: handleLayoutChange
        });
        _gridListInstance = _gridElement.data('_gridList');
        if (!gridDataParam.hasSetPositions()) {
            _gridElement.gridList('resize', _gridRows);
            thiz.toGridData().then(gridData => {
                _gridData = gridData;
                dataService.updateGrid(_gridData.id, _gridData);
            });
        }
        initResizing().then(() => {
            thiz.autosize();
        });
    }

    function initResizing() {
        let promises = [];
        if (enableResizing) {
            promises.push($(gridItemClass).resizable(getResizeOptions()));
        }

        $(document).on(constants.EVENT_GRID_RESIZE, () => {
            thiz.autosize();
        });
        return Promise.all(promises);
    }

    function refreshResizeOptions() {
        if(enableResizing) {
            $(gridItemClass).resizable('option', getResizeOptions());
        }
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
                            if(gridImage) {
                                var elementW = $('#' + idOfChangedElement)[0].getBoundingClientRect().width;
                                imageUtil.convertBase64(gridImage.data, elementW).then(convertedBase64 => {
                                    el.attr('data-img', convertedBase64);
                                    el.children().children()[0].style.backgroundImage = 'url("' + convertedBase64 + '")';
                                    resolve();
                                });
                            } else {
                                resolve();
                            }
                        });
                    } else {
                        resolve();
                    }
                });

                resizePromise.then(() => {
                    handleLayoutChange();
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
    }

    function notifyLayoutChangeEnd() {
        if ($.isFunction(_layoutChangedEndListener)) {
            setTimeout(function () {
                _layoutChangedEndListener(_gridData);
            }, _animationTimeMs);
        }
    }

    function handleLayoutChange() {
        return new Promise(resolve => {
            thiz.toGridData().then(currentGridData => {
                _undoService.updateGrid(currentGridData).then(updated => {
                    if(updated) {
                        _gridData = currentGridData;
                        thiz.autosize();
                        notifyLayoutChangeEnd();
                    }
                    resolve();
                });
            });
        });
    }

    /**
     * does automatic positioning of elements + resizing horizontal and vertical
     */
    thiz.autosize = function(timeout) {
        timeout = timeout || 0;
        setTimeout(function() {
            _gridElement.gridList('autosize');
            setTimeout(function () {
                fontUtil.adaptFontSizeForGridElements();
                if($('#grid-layout-background-vertical')[0] && _gridListInstance.items.length > 0) {
                    var sizeX = _gridListInstance._cellWidth;
                    var sizeY = _gridListInstance._cellHeight;
                    $('#grid-layout-background-vertical').css('margin-left', `${sizeX-5}px`);
                    $('#grid-layout-background-vertical').css('background-size',  `${sizeX}px ${sizeX}px`);
                    $('#grid-layout-background-horizontal').css('margin-top', `${sizeY-5}px`);
                    $('#grid-layout-background-horizontal').css('background-size',  `${sizeY}px ${sizeY}px`);
                }
            }, _animationTimeMs);
            refreshResizeOptions();
        }, timeout);
    };
    
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
        handleLayoutChange();
    };

    thiz.removeRow = function () {
        notifyLayoutChangeStart();
        if (_gridRows > 1) {
            _gridRows--;
            _gridElement.gridList('resize', _gridRows);
        }
        handleLayoutChange();
    };

    thiz.setNumberOfRows = function (nr) {
        notifyLayoutChangeStart();
        nr = Number.parseInt(nr);
        if (nr && nr > 0) {
            _gridRows = nr;
            _gridElement.gridList('resize', _gridRows);
        }
        handleLayoutChange();
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
            handleLayoutChange().then(() => {
                resolve(_gridData);
            });
        });

    };

    thiz.duplicateElement = function (id) {
        notifyLayoutChangeStart();
        var duplicatedElement = _gridData.gridElements.filter(el => el.id == id)[0].duplicate();
        dataService.updateOrAddGridElement(_gridData.id, duplicatedElement).then(() => {
            dataService.getGrid(_gridData.id).then(grid => {
                init(grid).then(() => {
                    _gridListInstance.resolveCollisions(duplicatedElement.id);
                    handleLayoutChange();
                });
            });
        });
        
    };

    /**
     * reloads the grid with updated data from dataService.
     * useful for applying changes made e.g. in label oder image of an element
     * @param gridData if specified the given gridData is used to reload, otherwise it is retrieved from dataService
     */
    thiz.reinit = function (gridData) {
        notifyLayoutChangeStart();
        init(gridData).then(() => {
            notifyLayoutChangeEnd();
        });
    };

    /**
     * tries to fill gaps in the layout by pulling all items to the left
     */
    thiz.fillGaps = function () {
        notifyLayoutChangeStart();
        _gridElement.gridList('fillGaps');
        handleLayoutChange();
    };

    /**
     * reverts the last layout change, if there was one
     */
    thiz.undo = function () {
        if (_undoService.canUndo()) {
            var newData = _undoService.doUndo();
            _gridData = new GridData(newData);
            init(_gridData).then(() => {
                notifyLayoutChangeEnd();
            });
        }
    };

    /**
     * reverts the last undo, if there was one
     */
    thiz.redo = function () {
        if (_undoService.canRedo()) {
            var newData = _undoService.doRedo();
            _gridData = new GridData(newData);
            init(_gridData).then(() => {
                notifyLayoutChangeEnd();
            });
        }
    };

    /**
     * reverts the last undo, if there was one
     */
    thiz.updateGridWithUndo = function (gridData) {
        _undoService.updateGrid(gridData).then(updated => {
            if (updated) {
                notifyLayoutChangeStart();
                init().then(() => {
                    notifyLayoutChangeEnd();
                });
            }
        });
    };

    thiz.canUndo = () => {
        return _undoService.canUndo();
    };

    thiz.canRedo = () => {
        return _undoService.canRedo();
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

    thiz.toGridData = function () {
        return new Promise(resolve => {
            dataService.getGrid(_gridData.id).then(savedGrid => {
                var newElems = [];
                
                //update layout specific data
                savedGrid.rowCount = _gridRows;
                _gridListInstance.items.forEach(function (item) {
                    var currentId = item.$element.attr('data-id');
                    var elem = savedGrid.gridElements.filter(el => el.id == currentId)[0];
                    elem.x = item.x;
                    elem.y = item.y;
                    elem.height = item.h;
                    elem.width = item.w;
                    if(elem.image && item.$element.attr('data-img')) {
                        elem.image.data = item.$element.attr('data-img');
                    }
                    newElems.push(elem);
                });
                savedGrid.gridElements = newElems;
                resolve(savedGrid);
            });
        });
    };

    thiz.getInitPromise = function () {
        return _initPromise;
    };

    thiz.isInitialized = function() {
        return _isInitialized;
    };

    thiz.destroy = function () {
        $(document).off(constants.EVENT_GRID_RESIZE);
        thiz.setLayoutChangedEndListener(null);
        thiz.setLayoutChangedStartListener(null);
    };

    init();
}

export {Grid};
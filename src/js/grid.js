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
import {gridUtil} from "./util/gridUtil";

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
    var _minGridColumns = null;
    var _initPromise = null;
    var _undoService = new UndoService();
    let _isInitialized = false;

    function init(gridDataParam) {
        _isInitialized = false;
        _initPromise = new Promise(resolve => {
            if (gridDataParam) {
                initData(options, gridDataParam);
                initGrid(_gridData).then(() => {
                    resolve();
                });
            } else {
                dataService.getGrid(options.gridId).then(gridData => {
                    initData(options, gridData);
                    initGrid(_gridData).then(() => {
                        resolve();
                    });
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
        _minGridColumns = _gridData.minColumnCount;
    }

    function initGrid(gridDataParam) {
        let promises = [];
        if (!options.dragAndDrop) { //only add global grid if not in edit mode
            gridDataParam.gridElements = gridDataParam.gridElements.filter(elem => !elem.hidden);
            promises.push(dataService.getGlobalGrid().then(globalGrid => {
                if (globalGrid) {
                    let autowidth = true;
                    let heightPercentage = options.globalGridHeightPercentage ? options.globalGridHeightPercentage / 100 : 0.15;
                    let heightFactorNormal = 1;
                    let heightFactorGlobal = 1;
                    if (globalGrid.getHeight() === 1) {
                        heightFactorGlobal = (heightPercentage * _gridData.rowCount) / (1 - heightPercentage);
                        heightFactorNormal = 1 / (_gridData.rowCount * heightPercentage) - (1 / _gridData.rowCount);
                        if (heightFactorGlobal >= 1) {
                            heightFactorNormal = 1;
                            heightFactorGlobal = Math.round(heightFactorGlobal);
                        } else {
                            heightFactorGlobal = 1;
                            heightFactorNormal = Math.round(heightFactorNormal);
                        }
                    }
                    let offset = gridUtil.getOffset(globalGrid);
                    let factorGrid = autowidth ? globalGrid.getWidth() - offset.x : 1;
                    let factorGlobal = autowidth ? _gridData.getWidthWithBounds() : 1;
                    globalGrid.gridElements.forEach(gridElement => {
                        gridElement.width *= factorGlobal;
                        gridElement.x *= factorGlobal;
                        if (gridElement.y === 0) {
                            gridElement.height *= heightFactorGlobal;
                        }
                    });
                    _gridData.gridElements.forEach(gridElement => {
                        gridElement.width *= factorGrid;
                        gridElement.x *= factorGrid;
                        gridElement.x += offset.x * factorGlobal;
                        gridElement.y += offset.y * heightFactorGlobal + (gridElement.y * (heightFactorNormal - 1));
                        gridElement.height *= heightFactorNormal;
                    });
                    _gridData.rowCount *= heightFactorNormal;
                    _gridData.rowCount += offset.y * heightFactorGlobal;
                    _gridRows = _gridData.rowCount;
                    _gridData.gridElements = globalGrid.gridElements.concat(_gridData.gridElements);
                }
                return Promise.resolve();
            }));
        }
        return Promise.all(promises).then(() => {
            collectElementService.initWithElements(_gridData.gridElements, dragAndDrop);
            predictionService.initWithElements(_gridData.gridElements);
            $(gridContainerId).empty();
            $(gridContainerId).append(templates.getGridBase(gridDataParam.id));
            _gridElement = $('#' + gridDataParam.id);
            gridDataParam.gridElements.forEach(function (gridElement) {
                _gridElement.append(gridElement.toHTML());
            });

            _gridElement.gridList({
                lanes: _gridRows,
                minColumns: _minGridColumns,
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
                thiz.autosize(_animationTimeMs);
            });
            return Promise.resolve();
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
        if (enableResizing) {
            $(gridItemClass).resizable(getResizeOptions());
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
        fontUtil.adaptFontSizeForGridElements();
        setTimeout(function() {
            _gridElement.gridList('autosize');
            setTimeout(function () {
                if($('#grid-layout-background-vertical')[0]) {
                    var sizeX = _gridListInstance._cellWidth;
                    var sizeY = _gridListInstance._cellHeight;
                    $('#grid-layout-background-vertical').css('margin-left', `${sizeX-5}px`);
                    $('#grid-layout-background-vertical').css('background-size',  `${sizeX}px ${sizeX}px`);
                    $('#grid-layout-background-horizontal').css('margin-top', `${sizeY-5}px`);
                    $('#grid-layout-background-horizontal').css('background-size',  `${sizeY}px ${sizeY}px`);
                    $('#grid-layout-background-wrapper').show();
                }
            }, 0);
            setTimeout(function () {
                fontUtil.adaptFontSizeForGridElements();
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

    thiz.setDimensions = function (rows, minColumns) {
        notifyLayoutChangeStart();
        rows = Number.parseInt(rows);
        minColumns = Number.parseInt(minColumns);
        if (rows && rows > 0) {
            _gridRows = rows;
            _minGridColumns = minColumns;
            _gridElement.gridList('resize', _gridRows, minColumns);
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

        _gridData.gridElements = _gridData.gridElements.filter(el => el.id !== idToRemove);
        return init(_gridData).then(() => {
            return handleLayoutChange();
        }).then(() => {
            return Promise.resolve(_gridData);
        });
    };

    thiz.duplicateElement = function (id) {
        notifyLayoutChangeStart();
        let duplicatedElement = _gridData.gridElements.filter(el => el.id === id)[0].duplicate();
        _gridData.gridElements.push(duplicatedElement);
        init(_gridData).then(() => {
            _gridListInstance.resolveCollisions(duplicatedElement.id);
            handleLayoutChange();
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
        return _initPromise;
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
        return new Promise(resolve => {
            _undoService.updateGrid(gridData).then(updated => {
                if (updated) {
                    notifyLayoutChangeStart();
                    init().then(() => {
                        resolve(true);
                        notifyLayoutChangeEnd();
                    });
                } else {
                    resolve(false);
                }
            });
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
            var newElems = [];

            //update layout specific data
            _gridData.rowCount = _gridRows;
            _gridData.minColumnCount = _minGridColumns;
            _gridListInstance.items.forEach(function (item) {
                var currentId = item.$element.attr('data-id');
                var existingElem = _gridData.gridElements.filter(el => el.id === currentId)[0];
                existingElem.x = item.x;
                existingElem.y = item.y;
                existingElem.height = item.h;
                existingElem.width = item.w;
                newElems.push(existingElem);
            });
            _gridData.gridElements = newElems;
            resolve(_gridData);
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
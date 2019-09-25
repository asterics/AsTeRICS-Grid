import $ from 'jquery';
import {inputEventHandler} from "./inputEventHandler";
import {InputConfig} from "../model/InputConfig";
import {timingLogger} from "../service/timingLogger";

let DirectionInput = {};

DirectionInput.getInstanceFromConfig = function (inputConfig, itemSelector, scanActiveClass, selectionListener) {
    return new DirectionInputConstructor(itemSelector, scanActiveClass, {
        inputEventLeft: inputConfig.dirInputs.filter(e => e.label === InputConfig.LEFT)[0],
        inputEventRight: inputConfig.dirInputs.filter(e => e.label === InputConfig.RIGHT)[0],
        inputEventUp: inputConfig.dirInputs.filter(e => e.label === InputConfig.UP)[0],
        inputEventDown: inputConfig.dirInputs.filter(e => e.label === InputConfig.DOWN)[0],
        inputEventSelect: inputConfig.dirInputs.filter(e => e.label === InputConfig.SELECT)[0],
        wrapAround: inputConfig.dirWrapAround,
        resetToStart: inputConfig.dirResetToStart,
        selectionListener: selectionListener
    });
};

/**
 * implements an input method for buttons/switches where the selected element can be changed in each direction
 * (left, right, up, down) and selected using buttons (keyboard input)
 *
 * @param paramItemSelector selector for retrieving the selectable elements
 * @param paramScanActiveClass class to add to currently selected element (focus)
 * @param options
 * @constructor
 */
function DirectionInputConstructor(paramItemSelector, paramScanActiveClass, options) {
    let thiz = this;

    //options
    let itemSelector = paramItemSelector;
    let scanActiveClass = paramScanActiveClass;
    let wrapAround = true;
    let resetToStart = false;

    //internal
    let _selectionListener = null;
    let _elements = null;
    let _currentElement = null;
    let _elementPosInfo = {};
    let _inputEventHandler = inputEventHandler.instance();

    thiz.start = function () {
        setActiveElement(_elements[0]);
        _inputEventHandler.startListening();
    };

    thiz.destroy = function () {
        _elements.removeClass(scanActiveClass);
        _inputEventHandler.destroy();
    };

    thiz.left = function () {
        doMove('left');
    };

    thiz.right = function () {
        doMove('right');
    };

    thiz.up = function () {
        doMove('up');
    };

    thiz.down = function () {
        doMove('down');
    };

    thiz.select = function () {
        if (_selectionListener) {
            _selectionListener(_currentElement);
        }
        if (resetToStart) {
            setActiveElement(_elements[0]);
        }
    };

    function init() {
        _elements = $(itemSelector);
        if (_elements.length === 0) {
            return;
        }
        setTimeout(() => {
            calcPositions();
        }, 200);
        parseOptions(options);
    }

    function doMove(direction) {
        if (!_elementPosInfo[_currentElement.id]) {
            return
        }
        setActiveElement(_elementPosInfo[_currentElement.id][direction]);
    }

    function parseOptions(options) {
        if (options) {
            if ($.isFunction(options.selectionListener)) {
                _selectionListener = options.selectionListener;
            }
            wrapAround = options.wrapAround !== undefined ? options.wrapAround : false;
            resetToStart = options.resetToStart !== undefined ? options.resetToStart : false;

            _inputEventHandler.onInputEvent(options.inputEventLeft, thiz.left);
            _inputEventHandler.onInputEvent(options.inputEventRight, thiz.right);
            _inputEventHandler.onInputEvent(options.inputEventUp, thiz.up);
            _inputEventHandler.onInputEvent(options.inputEventDown, thiz.down);
            _inputEventHandler.onInputEvent(options.inputEventSelect, thiz.select);
        }
    }

    function setActiveElement(element) {
        _currentElement = element || _currentElement;
        _elements.removeClass(scanActiveClass);
        $(_currentElement).addClass(scanActiveClass);
    }

    function calcPositions() {
        timingLogger.log();
        _elements.toArray().forEach(element => {
            let otherElements = _elements.toArray().filter(e => e.id !== element.id);
            let pos = element.getBoundingClientRect();
            let distancesX = otherElements.map(e => {
                let diff1 = pos.left - e.getBoundingClientRect().right;
                let diff2 = pos.right - e.getBoundingClientRect().left;
                let diff3 = pos.right - e.getBoundingClientRect().right;
                let diff4 = pos.left - e.getBoundingClientRect().left;
                let absDiff = Math.min(Math.abs(diff1), Math.abs(diff2), Math.abs(diff3), Math.abs(diff4));
                return {
                    element: e,
                    diff1: diff1,
                    diff2: diff2,
                    diff3: diff3,
                    diff4: diff4,
                    absDiff: absDiff
                };
            });
            let distancesY = otherElements.map(e => {
                let diff1 = pos.top - e.getBoundingClientRect().bottom;
                let diff2 = pos.bottom - e.getBoundingClientRect().top;
                let diff3 = pos.top - e.getBoundingClientRect().top;
                let diff4 = pos.bottom - e.getBoundingClientRect().bottom;
                let absDiff = Math.min(Math.abs(diff1), Math.abs(diff2), Math.abs(diff3), Math.abs(diff4));
                return {
                    element: e,
                    diff1: diff1,
                    diff2: diff2,
                    diff3: diff3,
                    diff4: diff4,
                    absDiff: absDiff
                };
            });

            let sortFn = (a, b) => a.absDiff - b.absDiff;
            let allPos = (e) => e.diff1 > 0 && e.diff2 > 0 && e.diff3 > 0 && e.diff4 > 0;
            let allNeg = (e) => e.diff1 < 0 && e.diff2 < 0 && e.diff3 < 0 && e.diff4 < 0;
            let upper = distancesY.filter(allPos).sort(sortFn);
            let lower = distancesY.filter(allNeg).sort(sortFn);
            let leftSide = distancesX.filter(allPos).sort(sortFn);
            let rightSide = distancesX.filter(allNeg).sort(sortFn);

            let maxXElements = distancesX.sort((a, b) => b.absDiff - a.absDiff);
            let maxYElements = distancesY.sort((a, b) => b.absDiff - a.absDiff);

            function getElement(dir1, firstChoiceDir2, secondChoiceDir2) {
                let dir1Elements = dir1.map(el => el.element);
                let firstChoiceDir2Elements = firstChoiceDir2.map(el => el.element);
                let secondChoiceDir2Elements = secondChoiceDir2.map(el => el.element);
                let intersect1 = intersect(dir1Elements, firstChoiceDir2Elements);
                if (intersect1.length > 0) {
                    let ranks = {};
                    dir1.concat(firstChoiceDir2).filter(el => intersect1.indexOf(el.element) > -1).forEach(el => {
                        ranks[el.element.id] = ranks[el.element.id] || 0;
                        ranks[el.element.id] += el.absDiff;
                    });
                    let min = Math.min(...Object.keys(ranks).map(key => ranks[key]));
                    let minIds = Object.keys(ranks).map(key => ranks[key] === min ? key : null).filter(el => !!el);
                    let minElements = intersect1.filter(element => minIds.indexOf(element.id) > -1);
                    return minElements[0];
                } else if (wrapAround) {
                    let min = Math.min(...dir1.map(el => el.absDiff));
                    let minElements = dir1.filter(el => el.absDiff === min).map(el => el.element);
                    return intersect(minElements, secondChoiceDir2Elements)[0];
                }
                return null;
            }

            function intersect(a, b) {
                let result = [];
                b.forEach(el => {
                    if (a.indexOf(el) > -1) {
                        result.push(el);
                    }
                });
                return result;
            }

            let left = getElement(distancesY, leftSide, maxXElements);
            let right = getElement(distancesY, rightSide, maxXElements);
            let up = getElement(distancesX, upper, maxYElements);
            let down = getElement(distancesX, lower, maxYElements);

            _elementPosInfo[element.id] = {
                element: element,
                left: left,
                right: right,
                up: up,
                down: down
            }
        });
        timingLogger.log();
    }
    init();
}

export {DirectionInput};
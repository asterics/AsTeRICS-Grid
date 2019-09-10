import $ from 'jquery';
import {inputEventHandler} from "./inputEventHandler";

/**
 * implements an input method for buttons/switches where the selected element can be changed in each direction
 * (left, right, up, down) and selected using buttons (keyboard input)
 *
 * @param paramItemSelector selector for retrieving the selectable elements
 * @param paramScanActiveClass class to add to currently selected element (focus)
 * @param options
 * @constructor
 */
function DirectionInput(paramItemSelector, paramScanActiveClass, options) {
    let thiz = this;

    //options
    let itemSelector = paramItemSelector;
    let scanActiveClass = paramScanActiveClass;
    let wrapAround = true;

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

    thiz.stop = function () {
        _inputEventHandler.stopListening();
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
        setActiveElement(_elements[0]);
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

            inputEventHandler.onInputEvent(options.inputEventLeft, thiz.left);
            inputEventHandler.onInputEvent(options.inputEventRight, thiz.right);
            inputEventHandler.onInputEvent(options.inputEventUp, thiz.up);
            inputEventHandler.onInputEvent(options.inputEventDown, thiz.down);
            inputEventHandler.onInputEvent(options.inputEventSelect, thiz.select);
        }
    }

    function setActiveElement(element) {
        _currentElement = element || _currentElement;
        _elements.removeClass(scanActiveClass);
        $(_currentElement).addClass(scanActiveClass);
    }

    function calcPositions() {
        _elements.toArray().forEach(element => {
            let otherElements = _elements.toArray().filter(e => e.id !== element.id);
            let pos = element.getBoundingClientRect();
            let minDistanceX = Infinity;
            let maxDistanceX = -1;
            let minDistanceY = Infinity;
            let maxDistanceY = -1;
            let distancesX = otherElements.map(e => {
                let diff = pos.left - e.getBoundingClientRect().left;
                let absDiff = Math.abs(diff);
                minDistanceX = minDistanceX > absDiff ? absDiff : minDistanceX;
                maxDistanceX = maxDistanceX < absDiff ? absDiff : maxDistanceX;
                return {
                    element: e,
                    diff: diff,
                    absDiff: absDiff
                };
            });
            let distancesY = otherElements.map(e => {
                let diff = pos.top - e.getBoundingClientRect().top;
                let absDiff = Math.abs(diff);
                minDistanceY = minDistanceY > absDiff ? absDiff : minDistanceY;
                maxDistanceY = maxDistanceY < absDiff ? absDiff : maxDistanceY;
                return {
                    element: e,
                    diff: pos.top - e.getBoundingClientRect().top,
                    absDiff: absDiff
                };
            });

            let sortFn = (a, b) => a.absDiff - b.absDiff;
            let upper = distancesY.filter(e => e.diff > 0).sort(sortFn).map(el => el.element);
            let lower = distancesY.filter(e => e.diff < 0).sort(sortFn).map(el => el.element);
            let leftSide = distancesX.filter(e => e.diff > 0).sort(sortFn).map(el => el.element);
            let rightSide = distancesX.filter(e => e.diff < 0).sort(sortFn).map(el => el.element);

            let minXElements = distancesX.filter(e => e.absDiff === minDistanceX).sort(sortFn).map(el => el.element);
            let minYElements = distancesY.filter(e => e.absDiff === minDistanceY).sort(sortFn).map(el => el.element);
            let maxXElements = distancesX.sort((a, b) => b.absDiff - a.absDiff).map(el => el.element);
            let maxYElements = distancesY.sort((a, b) => b.absDiff - a.absDiff).map(el => el.element);

            function getElement(dir1, firstChoiceDir2, secondChoiceDir2) {
                if (intersect(dir1, firstChoiceDir2).length > 0) {
                    return intersect(dir1, firstChoiceDir2)[0];
                } else if (wrapAround && intersect(dir1, secondChoiceDir2).length > 0) {
                    return intersect(dir1, secondChoiceDir2)[0];
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

            let left = getElement(minYElements, leftSide, maxXElements);
            let right = getElement(minYElements, rightSide, maxXElements);
            let up = getElement(minXElements, upper, maxYElements);
            let down = getElement(minXElements, lower, maxYElements);

            _elementPosInfo[element.id] = {
                element: element,
                left: left,
                right: right,
                up: up,
                down: down
            }
        });
    }
    init();
}

export {DirectionInput};
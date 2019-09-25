import $ from 'jquery';
import {inputEventHandler} from "./inputEventHandler";
import {InputConfig} from "../model/InputConfig";

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
        _elements.toArray().forEach(element => {
            let otherElements = _elements.toArray().filter(e => e.id !== element.id);
            let pos = element.getBoundingClientRect();
            let allPos = (a, b, c, d) => a > 0 && b > 0 && c > 0 && d > 0;
            let allNeg = (a, b, c, d) => a < 0 && b < 0 && c < 0 && d < 0;
            let distances = otherElements.map(e => {
                let boundingRect = e.getBoundingClientRect();
                let diff1 = pos.left - boundingRect.right;
                let diff2 = pos.right - boundingRect.left;
                let diff3 = pos.right - boundingRect.right;
                let diff4 = pos.left - boundingRect.left;
                let diff5 = pos.top - boundingRect.bottom;
                let diff6 = pos.bottom - boundingRect.top;
                let diff7 = pos.top - boundingRect.top;
                let diff8 = pos.bottom - boundingRect.bottom;
                let absDiffX = Math.min(Math.abs(diff1), Math.abs(diff2), Math.abs(diff3), Math.abs(diff4));
                let absDiffY = Math.min(Math.abs(diff5), Math.abs(diff6), Math.abs(diff7), Math.abs(diff8));
                return {
                    element: e,
                    left: allPos(diff1, diff2, diff3, diff4),
                    right: allNeg(diff1, diff2, diff3, diff4),
                    up: allPos(diff5, diff6, diff7, diff8),
                    down: allNeg(diff5, diff6, diff7, diff8),
                    absDiffX: absDiffX,
                    absDiffY: absDiffY,
                    absDiff: absDiffX + absDiffY
                };
            });

            let sortFn = (a, b) => a.absDiff - b.absDiff;
            distances = distances.sort(sortFn);

            function getElement(distances, firstChoiceDir, secondChoiceDir, secondChoiceMax, secondChoiceMin) {
                let firstChoice = distances.filter(e => e[firstChoiceDir]);
                if (firstChoice.length > 0) {
                    return firstChoice[0].element;
                } else if (wrapAround) {
                    let min = Math.min(...distances.map(e => e[secondChoiceMin]));
                    let possibleElements = distances.filter(e => e[secondChoiceMin] === min && e[secondChoiceDir]);
                    let max = Math.max(...possibleElements.map(e => e[secondChoiceMax]));
                    let result = possibleElements.filter(e => e[secondChoiceMax] === max)[0];
                    return result ? result.element : null;
                }
                return null;
            }

            let left = getElement(distances, 'left', 'right', 'absDiffX', 'absDiffY');
            let right = getElement(distances, 'right', 'left', 'absDiffX', 'absDiffY');
            let up = getElement(distances, 'up', 'down', 'absDiffY', 'absDiffX');
            let down = getElement(distances, 'down', 'up', 'absDiffY', 'absDiffX');

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
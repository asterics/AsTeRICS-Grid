import $ from 'jquery';

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
    let keyCodeLeft = 37; //Arrow left
    let keyCodeRight = 39; //Arrow right
    let keyCodeUp = 38; //Arrow up
    let keyCodeDown = 40; //Arrow down
    let keyCodeSelect = 32; //Space
    let wrapAround = true;

    //internal
    let _selectionListener = null;
    let _elements = null;
    let _currentElement = null;
    let _elementPosInfo = {};

    thiz.start = function () {
        _elements = $(itemSelector);
        if (_elements.length === 0) {
            return;
        }
        setTimeout(() => {
            calcPositions();
        }, 200);
        setActiveElement(_elements[0]);
        document.addEventListener('keydown', keyHandler);
    };

    thiz.stop = function () {
        document.removeEventListener('keydown', keyHandler);
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
        thiz.stop();
        thiz.start();
    };

    function init() {
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
        }
    }

    function setActiveElement(element) {
        _currentElement = element || _currentElement;
        _elements.removeClass(scanActiveClass);
        $(_currentElement).addClass(scanActiveClass);
    }

    function keyHandler(event) {
        let keycode = event.which || event.keyCode;
        switch (keycode) {
            case keyCodeLeft:
                event.preventDefault();
                thiz.left();
                break;
            case keyCodeRight:
                event.preventDefault();
                thiz.right();
                break;
            case keyCodeUp:
                event.preventDefault();
                thiz.up();
                break;
            case keyCodeDown:
                event.preventDefault();
                thiz.down();
                break;
            case keyCodeSelect:
                event.preventDefault();
                thiz.select();
                break;
        }
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
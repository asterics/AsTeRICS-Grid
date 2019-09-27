import { L } from "../util/lquery.js";

function Hover(itemSelector, hoverTimeoutMs, containerSelector, hoverActiveClass) {
    var thiz = this;
    var _itemSelector = itemSelector;
    var _hoverTimeoutMs = hoverTimeoutMs || 1000;
    var _selectionListener = null;
    var _isHovering = false;
    var _hoverMap = {};
    let _elements = [];
    let _lastElement = null;
    let _lastTouchEvent = null;

    function mouseEnter(event, targetParam) {
        var target = targetParam || this;
        event.preventDefault();
        onElement(target);
        _lastElement = target;
        _lastTouchEvent = event;
    }

    function mouseLeave(event, targetParam) {
        var target = targetParam || this;
        event.preventDefault();
        offElement(target);
    }

    function touchMove(event) {
        let element = getTouchElement(event);
        onElement(element);
        _lastElement = element;
        _lastTouchEvent = event;
    }

    function touchLeave(event) {
        let element = getTouchElement(event);
        offElement(element);
    }

    function onElement(element) {
        if (_lastElement && _lastElement !== element) {
            offElement(_lastElement);
        }
        if (!element || _hoverMap[element]) {
            return;
        }
        L.addClass(element, 'mouseentered');
        _hoverMap[element] = setTimeout(function () {
            if (_selectionListener) {
                _selectionListener(element);
            }
        }, _hoverTimeoutMs);
    }

    function offElement(element) {
        if (!element) {
            return;
        }
        L.removeClass(element, 'mouseentered');
        clearTimeout(_hoverMap[element]);
        _hoverMap[element] = null;
        _lastElement = null;
    }

    function getTouchElement(event) {
        if (event.touches.length === 0) {
            event = _lastTouchEvent;
        }
        let x = event.touches ? event.touches[0].pageX : event.pageX;
        let y = event.touches ? event.touches[0].pageY : event.pageY;
        let baseElement = document.elementFromPoint(x, y);
        return getParentElement(baseElement);
    }

    function getParentElement(element) {
        for (let i = 0; element && _elements.indexOf(element) === -1 && i < 100; i++) {
            element = element.parentElement;
        }
        return element;
    }

    thiz.startHovering = function () {
        _elements = L.selectAsList(_itemSelector);
        _elements.forEach(function (item) {
            item.addEventListener('mouseenter', mouseEnter);
            item.addEventListener('mouseleave', mouseLeave);
            item.addEventListener('touchstart', mouseEnter);
            item.addEventListener('touchend', touchLeave);
        });
        if (containerSelector) {
            L.selectAsList(containerSelector).forEach(function (item) {
                item.addEventListener('touchmove', touchMove)
            });
        }
    };

    thiz.destroy = function () {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.removeEventListener('mouseenter', mouseEnter);
            item.removeEventListener('mouseleave', mouseLeave);
            item.removeEventListener('touchstart', mouseEnter);
            item.removeEventListener('touchend', touchLeave);
        });
        if (containerSelector) {
            L.selectAsList(containerSelector).forEach(function (item) {
                item.removeEventListener('touchmove', touchMove)
            });
        }
        Object.keys(_hoverMap).forEach(key => {
            clearTimeout(_hoverMap[key]);
        });
    };

    thiz.setHoverTimeout = function (timeoutMs) {
        _hoverTimeoutMs = timeoutMs;
    };

    thiz.setSelectionListener = function (fn) {
        _selectionListener = fn;
    };
}


export {Hover};
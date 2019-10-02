import { L } from "../util/lquery.js";
import $ from 'jquery';
import {inputEventHandler} from "./inputEventHandler";
import {util} from "../util/util";

function Hover(itemSelector, hoverTimeoutMs, hoverActiveClass) {
    var thiz = this;
    var _itemSelector = itemSelector;
    var _hoverTimeoutMs = hoverTimeoutMs || 1000;
    var _selectionListener = null;
    var _hoverMap = {};
    let _elements = [];
    let _lastElement = null;
    let _lastTouchEvent = null;
    let _touchElementHidden = false;
    let _inputEventHandler = null;

    function mouseEnter(event, targetParam) {
        var target = targetParam || this;
        event.preventDefault();
        onElement(target);
        _lastElement = target;
        _lastTouchEvent = event;
    }

    function mouseLeave(event, targetParam) {
        if (!_touchElementHidden) {
            return;
        }
        var target = targetParam || this;
        event.preventDefault();
        offElement(target);
    }

    function mouseMove(event) {
        if (!_touchElementHidden) {
            _touchElementHidden = true;
            $('#touchElement').hide();
        }
        util.debounce(() => {
            _touchElementHidden = false;
            $('#touchElement').show();
        }, _hoverTimeoutMs + 10, 'hovering-mouseMove');
    }

    function mouseUp() {
        offElement(_lastElement);
    }

    function touchStart(event) {
        let element = getTouchElement(event);
        onElement(element);
        _lastElement = element;
    }

    function touchEnd(event) {
        offElement(_lastElement);
    }

    function touchMove(event) {
        util.throttle(() => {
            let element = getTouchElement(event);
            onElement(element);
            _lastElement = element;
            _lastTouchEvent = event;
        }, [], 50, 'hovering-touchmove');
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
        if (event.touches && event.touches.length === 0) {
            event = _lastTouchEvent;
        }
        if (!event) {
            log.warn('no event');
            return;
        }
        let x = event.touches ? event.touches[0].pageX : event.pageX || event.clientX;
        let y = event.touches ? event.touches[0].pageY : event.pageY || event.clientY;
        return util.getElement(_elements, x, y);
    }

    thiz.startHovering = function () {
        $('#touchElement').show();
        _elements = L.selectAsList(_itemSelector);
        _elements.forEach(function (item) {
            item.addEventListener('mouseenter', mouseEnter);
            item.addEventListener('mouseleave', mouseLeave);
            item.addEventListener('mouseup', mouseUp);
        });
        _inputEventHandler = inputEventHandler.instance();
        _inputEventHandler.onTouchStart(touchStart);
        _inputEventHandler.onTouchEnd(touchEnd);
        _inputEventHandler.onTouchMove(touchMove);
        _inputEventHandler.startListening();
        document.addEventListener("mousemove", mouseMove);
    };

    thiz.destroy = function () {
        util.clearDebounce('hovering-mouseMove');
        _elements.forEach(function (item) {
            item.removeEventListener('mouseenter', mouseEnter);
            item.removeEventListener('mouseleave', mouseLeave);
            item.removeEventListener('mouseup', mouseUp);
        });
        _inputEventHandler.destroy();
        document.removeEventListener("mousemove", mouseMove);
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
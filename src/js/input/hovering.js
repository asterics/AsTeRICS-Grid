import { L } from "../util/lquery.js";

function Hover(itemSelector, hoverTimeoutMs, hoverActiveClass) {
    var thiz = this;
    var _itemSelector = itemSelector;
    var _hoverActiveClass = hoverActiveClass;
    var _hoverTimeoutMs = hoverTimeoutMs || 1000;
    var _selectionListener = null;
    var _isHovering = false;
    var _hoverMap = {};

    function mouseEnter(event, targetParam) {
        var target = targetParam || this;
        event.preventDefault();
        L.addClass(target, 'mouseentered');
        if(_hoverMap[target]) {
            mouseLeave(event, target);
            return;
        }
        _hoverMap[target] = setTimeout(function () {
            if (_selectionListener) {
                _selectionListener(target);
            }
        }, _hoverTimeoutMs);
    }

    function mouseLeave(event, targetParam) {
        var target = targetParam || this;
        event.preventDefault();
        L.removeClass(target, 'mouseentered');
        clearTimeout(_hoverMap[target]);
        _hoverMap[target] = null;
    }

    thiz.startHovering = function () {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.addEventListener('mouseenter', mouseEnter);
            item.addEventListener('mouseleave', mouseLeave);
            item.addEventListener('touchstart', mouseEnter);
            item.addEventListener('touchend', mouseLeave);
        });
    };

    thiz.stopHovering = function () {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.removeEventListener('mouseenter', mouseEnter);
            item.removeEventListener('mouseleave', mouseLeave);
            item.removeEventListener('touchstart', mouseEnter);
            item.removeEventListener('touchend', mouseLeave);
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
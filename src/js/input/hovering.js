import { L } from "../../lib/lquery.js";

function Hover(itemSelector, hoverActiveClass) {
    var thiz = this;
    var _itemSelector = itemSelector;
    var _hoverActiveClass = hoverActiveClass;
    var _hoverTimeoutMs = 1000;
    var _selectionListener = null;
    var _isHovering = false;
    var _hoverMap = {};

    function mouseEnter(event) {
        L.addClass(this, 'mouseentered');
        _hoverMap[event.target] = setTimeout(function () {
            if (_selectionListener) {
                _selectionListener(event.target);
            }
        }, _hoverTimeoutMs);
    }

    function mouseLeave(event) {
        L.removeClass(this, 'mouseentered');
        clearTimeout(_hoverMap[event.target]);
    }

    thiz.startHovering = function () {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.addEventListener('mouseenter', mouseEnter);
            item.addEventListener('mouseleave', mouseLeave);
        });
    };

    thiz.stopHovering = function () {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.removeEventListener('mouseenter', mouseEnter);
            item.removeEventListener('mouseleave', mouseLeave);
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
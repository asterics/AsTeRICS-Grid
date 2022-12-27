import { L } from "../util/lquery.js";
import {util} from "../util/util.js";

let Clicker = {};

Clicker.getInstanceFromConfig = function (inputConfig, itemSelector) {
    return new ClickerConstructor(itemSelector, {
        useMousedownEvent: inputConfig.mouseDownInsteadClick,
        useDoubleclick: inputConfig.mouseDoubleClickEnabled,
        useSingleClick: inputConfig.mouseclickEnabled
    });
};

function ClickerConstructor(itemSelector, options) {
    options = options || {};
    let thiz = this;
    let _itemSelector = itemSelector;
    let _selectionListener = null;
    let _elements = [];
    let _isIncompleteTouch = false;

    function onclick(event) {
        if (_selectionListener) {
            _selectionListener(event.currentTarget);
        }
    }

    function onMouseDown(event) {
        if (_isIncompleteTouch) {
            return;
        }
        util.throttle(onclick, [event], 300, "CLICK_EVENT_HANDLER");
    }

    function onTouchStart(event) {
        if (_isIncompleteTouch) {
            return;
        }
        _isIncompleteTouch = true;
        util.throttle(onclick, [event], 300, "CLICK_EVENT_HANDLER");
    }

    function onTouchEnd(event) {
        _isIncompleteTouch = false;
    }

    function ondblclick(event) {
        if (_selectionListener) {
            _selectionListener(event.currentTarget);
        }
    }

    function onkeydown(event) {
        let code = event.which || event.keyCode;
        if (code === 13 || code === 32) {
            if (_selectionListener) {
                _selectionListener(event.currentTarget);
            }
        }
    }

    thiz.startClickcontrol = function () {
        _elements = L.selectAsList(_itemSelector);
        _elements.forEach(function (item) {
            if (options.useSingleClick && options.useMousedownEvent) {
                item.addEventListener('mousedown', onMouseDown);
                item.addEventListener('touchstart', onTouchStart);
                item.addEventListener('touchend', onTouchEnd);
            } else if (options.useSingleClick) {
                item.addEventListener('click', onclick);
            }
            if (options.useDoubleclick) {
                item.addEventListener('dblclick', ondblclick);
            }
            item.addEventListener('keydown', onkeydown);
        });
    };

    thiz.destroy = function () {
        _elements.forEach(function (item) {
            item.removeEventListener('mousedown', onMouseDown);
            item.removeEventListener('touchstart', onTouchStart);
            item.removeEventListener('touchend', onTouchEnd);
            item.removeEventListener('click', onclick);
            item.removeEventListener('dblclick', ondblclick);
            item.removeEventListener('keydown', onkeydown);
        });
    };

    thiz.setSelectionListener = function (fn) {
        _selectionListener = fn;
    };
}

export {Clicker};
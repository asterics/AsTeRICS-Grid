import { L } from '../util/lquery.js';
import { util } from '../util/util.js';
import { inputEventHandler } from './inputEventHandler.js';

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
    let _enableMouseDown = true;

    function onclick(event) {
        if (_selectionListener) {
            _selectionListener(event.currentTarget);
        }
    }

    function onMouseDown(event) {
        event.preventDefault(); // prevent zooming on longpress on images on iOS
        if (!_enableMouseDown || inputEventHandler.global.hasIncompleteTouchEvent()) {
            return;
        }
        util.throttle(onclick, [event], 300, 'CLICK_EVENT_HANDLER');
    }

    function onTouchStart(event) {
        _enableMouseDown = false;
        if (inputEventHandler.global.hasIncompleteTouchEvent()) {
            return;
        }
        util.throttle(onclick, [event], 300, 'CLICK_EVENT_HANDLER');
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
                item.addEventListener('touchend', inputEventHandler.global.resetIncompleteTouchEvent); //needed because 'touchend' on document does not fire (but on element does) if element removed, see https://bugs.chromium.org/p/chromium/issues/detail?id=464579 and https://jsfiddle.net/jq3L6xo4/4/
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
            item.removeEventListener('click', onclick);
            item.removeEventListener('dblclick', ondblclick);
            item.removeEventListener('keydown', onkeydown);
        });
    };

    thiz.setSelectionListener = function (fn) {
        _selectionListener = fn;
    };
}

export { Clicker };

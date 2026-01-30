import { L } from '../util/lquery.js';
import {speechService} from "../service/speechService.js";

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
    let lastOnClick = 0;

    function onclick(event) {
        if (new Date().getTime() - lastOnClick < 100) {
            return;
        }
        lastOnClick = new Date().getTime();
        if (_selectionListener) {
            _selectionListener(event.currentTarget);
        }
    }

    function onInputStart(event) {
        if (!speechService.hasSpoken() && event.type === 'mousedown') {
            onclick(event);
            return;
        }
        if (speechService.hasSpoken()) {
            event.preventDefault(); // prevent zooming on longpress on images on iOS
        }
        if (event.type === 'mousedown' && event.buttons === 0) {
            // no button pressed (emulated from touchscreen)
            return;
        }
        onclick(event);
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
                item.addEventListener('mousedown', onInputStart);
                item.addEventListener('touchstart', onInputStart);
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
            item.removeEventListener('mousedown', onInputStart);
            item.removeEventListener('touchstart', onInputStart);
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

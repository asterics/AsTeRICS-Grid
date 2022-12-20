import { L } from "../util/lquery.js";

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

    function onclick(event) {
        if (_selectionListener) {
            _selectionListener(event.currentTarget);
        }
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
                item.addEventListener('mousedown', onclick);
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
            item.removeEventListener('mousedown', onclick);
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
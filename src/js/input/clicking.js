import { L } from "../util/lquery.js";

function Clicker(itemSelector) {
    var thiz = this;
    var _itemSelector = itemSelector;
    var _selectionListener = null;

    function onclick(event) {
        if (_selectionListener) {
            _selectionListener(event.currentTarget);
        }
    }

    function onkeydown(event) {
        let code = event.which || event.keyCode;
        if (code === 13 || code === 32) {
            onclick(event);
        }
    }

    thiz.startClickcontrol = function () {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.addEventListener('click', onclick);
            item.addEventListener('keydown', onkeydown);
        });
    };

    thiz.stopClickcontrol = function () {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.removeEventListener('click', onclick);
            item.removeEventListener('keydown', onkeydown);
        });
    };

    thiz.setSelectionListener = function (fn) {
        _selectionListener = fn;
    };
}

export {Clicker};
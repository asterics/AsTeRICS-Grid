import { L } from "../../lib/lquery.js";

function Clicker(itemSelector) {
    var thiz = this;
    var _itemSelector = itemSelector;
    var _selectionListener = null;

    function onclick(event) {
        if (_selectionListener) {
            _selectionListener(event.currentTarget);
        }
    }

    thiz.startClickcontrol = function () {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.addEventListener('click', onclick);
        });
    };

    thiz.stopClickcontrol = function () {
        L.selectAsList(_itemSelector).forEach(function (item) {
            item.removeEventListener('click', onclick);
        });
    };

    thiz.setSelectionListener = function (fn) {
        _selectionListener = fn;
    };
}

export {Clicker};
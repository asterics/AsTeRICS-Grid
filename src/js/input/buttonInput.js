import $ from 'jquery';

function ButtonInput(paramItemSelector, paramScanActiveClass, options) {
    let thiz = this;

    //options
    let itemSelector = paramItemSelector;
    let scanActiveClass = paramScanActiveClass;

    //internal
    let _selectionListener = null;

    function init() {
        parseOptions(options);
    }

    function parseOptions(options) {
        if (options) {
        }
    }

    thiz.start = function () {
        let elements = $(itemSelector);
        window.test = elements;
        if (elements.length === 0) {
            return;
        }
        elements.first().addClass(scanActiveClass);
    };
    init();
}

export {ButtonInput};
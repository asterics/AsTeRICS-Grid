import $ from 'jquery';
import {inputEventHandler} from "./inputEventHandler";
import {InputConfig} from "../model/InputConfig";

let SequentialInput = {};

SequentialInput.getInstanceFromConfig = function (inputConfig, itemSelector, options) {
    return new SequentialInputConstructor(itemSelector, {
        selectionListener: options.selectionListener,
        activeListener: options.activeListener,
        inputEventSelect: inputConfig.seqInputs.filter(e => e.label === InputConfig.SELECT)[0],
        inputEventNext: inputConfig.seqInputs.filter(e => e.label === InputConfig.NEXT_ELEMENT)[0],
        inputEventPrev: inputConfig.seqInputs.filter(e => e.label === InputConfig.PREVIOUS_ELEMENT)[0]
    });
};

/**
 * implements an input method that just iterates through all elements sequentially
 * @param paramItemSelector
 * @param options
 * @constructor
 */
function SequentialInputConstructor(paramItemSelector, options) {
    let thiz = this;

    //options
    let itemSelector = paramItemSelector;

    //internal
    let _activeClass = null;
    let _selectionListener = null;
    let _activeListener = null;
    let _elements = null;
    let _inputEventHandler = null;
    let _activeId = 0;

    thiz.start = function () {
        _inputEventHandler.startListening();
        setActiveElement(_elements[0]);
        _activeId = 0;
    };

    thiz.destroy = function () {
        _inputEventHandler.destroy();
        _elements.removeClass(_activeClass);
    };

    thiz.next = function () {
        _activeId++;
        if (_activeId > _elements.length - 1) {
            _activeId = 0;
        }
        setActiveElement(_elements[_activeId]);
    };

    thiz.prev = function () {
        _activeId--;
        if (_activeId < 0) {
            _activeId = _elements.length - 1;
        }
        setActiveElement(_elements[_activeId]);
    };

    thiz.select = function () {
        if (_selectionListener) {
            _selectionListener(_elements[_activeId]);
        }
    };

    function init() {
        _inputEventHandler = inputEventHandler.instance();
        parseOptions(options);
        _elements = $(itemSelector);
    }

    function parseOptions(options) {
        if (!options || !options.inputEventSelect || !options.inputEventNext) {
            return;
        }
        if ($.isFunction(options.selectionListener)) {
            _selectionListener = options.selectionListener;
        }
        if ($.isFunction(options.activeListener)) {
            _activeListener = options.activeListener;
        }
        _activeClass = options.activeClass || 'scanFocus';

        _inputEventHandler.onInputEvent(options.inputEventSelect, () => {
            thiz.select();
        });

        _inputEventHandler.onInputEvent(options.inputEventNext, () => {
            thiz.next();
        });

        _inputEventHandler.onInputEvent(options.inputEventPrev, () => {
            thiz.prev();
        });
    }

    function setActiveElement(element) {
        _elements.removeClass(_activeClass);
        $(element).addClass(_activeClass);
        if (_activeListener) {
            _activeListener(element);
        }
    }

    init();
}

export {SequentialInput};
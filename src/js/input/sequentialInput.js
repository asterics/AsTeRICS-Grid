import $ from '../externals/jquery.js';
import { inputEventHandler } from './inputEventHandler';
import { InputConfig } from '../model/InputConfig';

let SequentialInput = {};

SequentialInput.getInstanceFromConfig = function (inputConfig, itemSelector, options) {
    return new SequentialInputConstructor(itemSelector, {
        selectionListener: options.selectionListener,
        activeListener: options.activeListener,
        activeClass: options.activeClass,
        inputEventSelect: inputConfig.seqInputs.filter((e) => e.label === InputConfig.SELECT)[0],
        inputEventNext: inputConfig.seqInputs.filter((e) => e.label === InputConfig.NEXT_ELEMENT)[0],
        inputEventPrev: inputConfig.seqInputs.filter((e) => e.label === InputConfig.PREVIOUS_ELEMENT)[0],
        enableAuto: inputConfig.seqAuto,
        autoTimeout: inputConfig.seqTimeoutMs,
        firstElementFactor: inputConfig.seqTimeoutFirstElementFactor,
        resetAfterSelect: inputConfig.seqResetToStart
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
    options.firstElementFactor = options.firstElementFactor || 1;

    //internal
    let _activeClass = null;
    let _selectionListener = null;
    let _activeListener = null;
    let _elements = null;
    let _inputEventHandler = null;
    let _activeId = 0;
    let _autoTimeoutHandler = null;

    thiz.start = function () {
        _inputEventHandler.startListening();
        setActiveElement(_elements[0], true);
        _activeId = 0;
        scheduleNextAuto();
    };

    thiz.stop = function () {
        clearTimeout(_autoTimeoutHandler);
    };

    thiz.destroy = function () {
        thiz.stop();
        _inputEventHandler.destroy();
        _elements.removeClass(_activeClass);
    };

    thiz.next = function () {
        _activeId++;
        let wrap = false;
        if (_activeId > _elements.length - 1) {
            _activeId = 0;
            wrap = true;
        }
        setActiveElement(_elements[_activeId], wrap);
        scheduleNextAuto();
    };

    thiz.prev = function () {
        _activeId--;
        let wrap = false;
        if (_activeId < 0) {
            _activeId = _elements.length - 1;
            wrap = true;
        }
        setActiveElement(_elements[_activeId], wrap);
    };

    thiz.select = function () {
        if (_selectionListener) {
            _selectionListener(_elements[_activeId]);
        }
        if (options.resetAfterSelect) {
            thiz.stop();
            thiz.start();
        }
    };

    function scheduleNextAuto() {
        if (options.enableAuto) {
            let timeout = options.autoTimeout || 1000;
            let factor = _activeId === 0 ? options.firstElementFactor : 1;
            _autoTimeoutHandler = setTimeout(() => {
                thiz.next();
            }, timeout * factor);
        }
    }

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

    function setActiveElement(element, wrap) {
        _elements.removeClass(_activeClass);
        $(element).addClass(_activeClass);
        if (_activeListener) {
            _activeListener(element, wrap);
        }
    }

    init();
}

export { SequentialInput };

import $ from '../externals/jquery.js';
import { inputEventHandler } from './inputEventHandler';
import { InputConfig } from '../model/InputConfig';

let SequentialInput = {};

SequentialInput.getInstanceFromConfig = function (inputConfig, options) {
    return new SequentialInputConstructor({
        itemSelector: options.itemSelector,
        selectionListener: options.selectionListener,
        activeListener: options.activeListener,
        activeClass: options.activeClass,
        inputEventSelect: inputConfig.seqInputs.filter((e) => e.label === InputConfig.SELECT)[0],
        inputEventNext: inputConfig.seqInputs.filter((e) => e.label === InputConfig.NEXT_ELEMENT)[0],
        inputEventPrev: inputConfig.seqInputs.filter((e) => e.label === InputConfig.PREVIOUS_ELEMENT)[0],
        enableAuto: inputConfig.seqAuto,
        autoTimeout: inputConfig.seqTimeoutMs,
        firstElementFactor: inputConfig.seqTimeoutFirstElementFactor,
        resetAfterSelect: inputConfig.seqResetToStart,
        startWithAction: inputConfig.seqStartWithAction,
        roundsUntilStop: inputConfig.seqRoundsUntilStop
    });
};

/**
 * implements an input method that just iterates through all elements sequentially
 * @param options
 * @constructor
 */
function SequentialInputConstructor(options) {
    let thiz = this;

    //options
    if (!options || !options.inputEventSelect || !options.inputEventNext) {
        log.warn("missing parameters for instantiating sequential input");
        return;
    }
    options.firstElementFactor = options.firstElementFactor || 1;
    options.activeClass = options.activeClass || 'scanFocus';

    //internal
    let _elements = $(options.itemSelector);
    let _inputEventHandler = inputEventHandler.instance();
    let _startEventHandler = inputEventHandler.instance();
    let _activeId = 0;
    let _currentRound = 0;
    let _autoTimeoutHandler = null;

    thiz.start = function (forceStart) {
        if (options.startWithAction && !forceStart) {
            _startEventHandler.onInputEvent(options.inputEventSelect, start);
            _startEventHandler.onInputEvent(options.inputEventNext, start);
            _startEventHandler.onInputEvent(options.inputEventPrev, start);

            function start() {
                _startEventHandler.destroy();
                _startEventHandler = inputEventHandler.instance();
                setupInputEventHandler();
                startInternal();
            }

            _startEventHandler.startListening();
        } else {
            setupInputEventHandler();
            startInternal();
        }
    };

    thiz.stop = function () {
        clearTimeout(_autoTimeoutHandler);
        _elements.removeClass(options.activeClass);
        _inputEventHandler.stopListening();
        _startEventHandler.stopListening();
    };

    thiz.destroy = function () {
        thiz.stop();
        _inputEventHandler.destroy();
        _startEventHandler.destroy();
        _elements.removeClass(options.activeClass);
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
        if (options.selectionListener) {
            options.selectionListener(_elements[_activeId]);
        }
        if (options.resetAfterSelect) {
            thiz.stop();
            startInternal();
        }
    };

    function startInternal() {
        _inputEventHandler.startListening();
        setActiveElement(_elements[0], true);
        _activeId = 0;
        scheduleNextAuto();
    }

    function scheduleNextAuto() {
        if (options.enableAuto) {
            let timeout = options.autoTimeout || 1000;
            let factor = _activeId === 0 ? options.firstElementFactor : 1;
            if (_activeId === 0) {
                _currentRound++;
            }
            clearTimeout(_autoTimeoutHandler);
            _autoTimeoutHandler = setTimeout(() => {
                if (options.startWithAction && options.roundsUntilStop && _currentRound === options.roundsUntilStop && _activeId === _elements.length - 1) {
                    _currentRound = 0;
                    thiz.stop();
                    thiz.start();
                    return;
                }
                thiz.next();
            }, timeout * factor);
        }
    }

    function setActiveElement(element, wrap) {
        _elements.removeClass(options.activeClass);
        $(element).addClass(options.activeClass);
        if (options.activeListener) {
            options.activeListener(element, wrap);
        }
    }

    function setupInputEventHandler() {
        _inputEventHandler.destroy();
        _inputEventHandler = inputEventHandler.instance();
        _inputEventHandler.onInputEvent(options.inputEventSelect, thiz.select);
        _inputEventHandler.onInputEvent(options.inputEventNext, thiz.next);
        _inputEventHandler.onInputEvent(options.inputEventPrev, thiz.prev);
    }
}

export { SequentialInput };

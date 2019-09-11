import {util} from "../util/util";
import {InputEventKey} from "../model/InputEventKey";
import {InputEventARE} from "../model/InputEventARE";

let inputEventHandler = {};

inputEventHandler.instance = function () {
    return new Constructor();
};

function Constructor () {
    let thiz = {};

    // options
    let touchMoveLength = 100;
    let mouseBorderThreshold = 5;

    // internal
    let _touchMoveBeginPosX = null;
    let _touchMoveBeginPosY = null;
    let mouseBorderHandlers = [];
    let swipeUpHandlers = [];
    let swipeDownHandlers = [];
    let swipeLeftHandles = [];
    let swipeRightHandles = [];
    let keyHandlers = {}; //keycode => [{handler, lastKeydown, lastAction, counter, inputEventKey}]
    let _touchElement = document;
    let _listening = false;

    thiz.startListening = function () {
        if (_listening) {
            return;
        }
        _listening = true;
        document.addEventListener('mousemove', mouseMoveListener);
        document.addEventListener('keydown', keyboardListener);
        document.addEventListener('keyup', keyUpListener);
        _touchElement.addEventListener('touchmove', touchMoveListener);
        _touchElement.addEventListener('touchend', touchEndListener);
    };

    thiz.stopListening = function () {
        _listening = false;
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('keydown', keyboardListener);
        document.removeEventListener('keyup', keyUpListener);
        _touchElement.removeEventListener('touchmove', touchMoveListener);
        _touchElement.removeEventListener('touchend', touchEndListener);
    };

    thiz.onMouseUpperOrLeftBorder = function (fn) {
        return registerHandler(fn, mouseBorderHandlers);
    };

    thiz.onSwipedDown = function (fn) {
        return registerHandler(fn, swipeDownHandlers);
    };

    thiz.onSwipedUp = function (fn) {
        return registerHandler(fn, swipeUpHandlers);
    };

    thiz.onSwipedRight = function (fn) {
        return registerHandler(fn, swipeRightHandles);
    };

    thiz.onSwipedLeft = function (fn) {
        return registerHandler(fn, swipeLeftHandles);
    };

    thiz.onEscape = function (fn) {
        return registerKey(new InputEventKey({keyCode: 27}), fn); //ESC
    };

    thiz.onInputEvent = function (inputEvent, fn) {
        if (!inputEvent || !fn) {
            return;
        }
        switch (inputEvent.modelName) {
            case InputEventKey.getModelName():
                return registerKey(inputEvent, fn);
            case InputEventARE.getModelName():
                //TODO
                break;
        }
    };

    function registerKey(inputEventKeyInstance, fn) {
        if (!inputEventKeyInstance || !inputEventKeyInstance.keyCode || !fn) {
            return;
        }
        let key = inputEventKeyInstance.keyCode + "";
        let array = keyHandlers[key] ? keyHandlers[key] : [];
        keyHandlers[key] = array;
        array.push(getKeyHandlerEntry(fn, inputEventKeyInstance));
    }

    function getKeyHandlerEntry(handlerFn, inputEventKeyInstance) {
        return {
            handler: handlerFn,
            inputEvent: inputEventKeyInstance,
            lastKeydown: null,
            lastAction: null,
            counter: 0,
            timeoutHandler: null
        }
    }

    function mouseMoveListener(event) {
        if (event.clientY < mouseBorderThreshold || event.clientX < mouseBorderThreshold) {
            callHandlers(mouseBorderHandlers);
        }
    }

    function touchMoveListener(event) {
        if (!_touchMoveBeginPosY || !_touchMoveBeginPosX) {
            _touchMoveBeginPosY = event.touches[0].clientY;
            _touchMoveBeginPosX = event.touches[0].clientX;
        } else if (event.touches[0].clientY > _touchMoveBeginPosY + touchMoveLength) {
            log.debug('swipe down.');
            _touchMoveBeginPosY = null;
            callHandlers(swipeDownHandlers);
        } else if (event.touches[0].clientY < _touchMoveBeginPosY - touchMoveLength) {
            log.debug('swipe up.');
            _touchMoveBeginPosY = null;
            callHandlers(swipeUpHandlers);
        } else if (event.touches[0].clientX > _touchMoveBeginPosX + touchMoveLength) {
            log.debug('swipe right.');
            _touchMoveBeginPosX = null;
            callHandlers(swipeRightHandles);
        } else if (event.touches[0].clientX < _touchMoveBeginPosX - touchMoveLength) {
            log.debug('swipe left.');
            _touchMoveBeginPosX = null;
            callHandlers(swipeLeftHandles);
        }
    }

    function keyboardListener(event) {
        if (event.repeat) {
            return;
        }
        let keyCode = event.which || event.keyCode;
        let key = keyCode + "";
        if (keyHandlers[key]) {
            event.preventDefault();
            let entries = keyHandlers[key];
            entries.forEach(entry => {
                let ie = entry.inputEvent;
                if (!ie.repeat && !ie.holdDuration && timeoutPassed(entry.lastAction, ie.timeout)) {
                    let existsConflicting = entries.filter(e => e !== entry && e.inputEvent.holdDuration).length > 0;
                    if (existsConflicting) {
                        entry.doOnKeyup = () => {
                            doEntry(entry);
                        }
                    } else {
                        doEntry(entry);
                    }
                } else if (ie.repeat) {
                    if (timeoutPassed(entry.lastKeydown, ie.timeout)) {
                        entry.counter = 0;
                    }
                    entry.counter++;
                    if (entry.counter === ie.repeat) {
                        let existsConflicting = entries.filter(e => e !== entry && e.inputEvent.repeat > ie.repeat).length > 0;
                        let timeout = existsConflicting ? (ie.timeout || 500) : 0;
                        entry.counter = 0;
                        entry.timeoutHandler = setTimeout(() => {
                            entries.filter(e => e !== entry && e.inputEvent.repeat).forEach(e => clearTimeout(e.timeoutHandler));
                            doEntry(entry);
                        }, timeout);
                    }
                } else if (ie.holdDuration) {
                    entry.timeoutHandler = setTimeout(() => {
                        entries.filter(e => e.doOnKeyup).forEach(e => {
                            e.doOnKeyup = null
                        });
                        doEntry(entry);
                    }, ie.holdDuration);
                }
                entry.lastKeydown = new Date().getTime();
            });
        }

        function doEntry(entry) {
            entry.lastAction = new Date().getTime();
            entry.handler();
        }
    }

    function keyUpListener(event) {
        if (event.repeat) {
            return;
        }
        let keyCode = event.which || event.keyCode;
        let key = keyCode + "";
        if (keyHandlers[key]) {
            let entries = keyHandlers[key];
            entries.forEach(entry => {
                if (!entry.inputEvent.repeat && entry.inputEvent.holdDuration && entry.timeoutHandler) {
                    clearTimeout(entry.timeoutHandler);
                }
                if (entry.doOnKeyup) {
                    entry.doOnKeyup();
                    entry.doOnKeyup = null;
                }
            })
        }
    }

    function timeoutPassed(lastTimeMs, timeoutMs) {
        if (!lastTimeMs || !timeoutMs) {
            return true;
        }
        return new Date().getTime() - lastTimeMs > timeoutMs;
    }

    function touchEndListener() {
        _touchMoveBeginPosX = null;
        _touchMoveBeginPosY = null;
    }

    function registerHandler(fn, array) {
        if (fn) {
            array.push(fn);
        }
        return thiz;
    }

    function callHandlers(array) {
        array.forEach(handler => {
            util.throttle(handler);
        });
    }

    return thiz;
};

inputEventHandler.global = inputEventHandler.instance();

export {inputEventHandler};
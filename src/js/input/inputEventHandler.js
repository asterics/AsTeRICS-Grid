import {util} from "../util/util";
import {InputEventKey} from "../model/InputEventKey";
import {InputEventARE} from "../model/InputEventARE";
import {areService} from "../service/areService";

let inputEventHandler = {};
let allInstances = [];
let pausedStates = {};
let idCounter = 0;

inputEventHandler.instance = function () {
    let newInstance = new Constructor();
    allInstances.push(newInstance);
    return newInstance;
};

inputEventHandler.pauseAll = function () {
    allInstances.forEach(instance => {
        pausedStates[instance.getID()] = instance.isListening();
        instance.stopListening();
    });
};

inputEventHandler.resumeAll = function () {
    allInstances.forEach(instance => {
        if (pausedStates[instance.getID()]) {
            instance.startListening();
        }
    });
};

function Constructor() {
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
    let touchMoveHandlers = [];
    let touchStartHandlers = [];
    let touchEndHandlers = [];
    let anyKeyHandlers = [];
    let exitFullscreenHandlers = [];
    let keyHandlers = {}; //keycode => [{handler, lastKeydown, lastAction, counter, inputEventKey}]
    let _touchElement = document.body;
    let _listening = false;
    let _areInputEvents = {}; //ID -> inputEvent, fn
    let _id = (idCounter++);

    thiz.startListening = function () {
        if (_listening) {
            return;
        }
        _listening = true;
        subscribeAREEvents();
        document.addEventListener('mousemove', mouseMoveListener);
        document.addEventListener('keydown', keyboardListener);
        document.addEventListener('keyup', keyUpListener);
        document.addEventListener('fullscreenchange', fullscreenChangeListener);
        _touchElement.addEventListener('touchmove', touchMoveListener, {passive: false} );
        _touchElement.addEventListener('touchstart', touchStartListener);
        _touchElement.addEventListener('touchend', touchEndListener);
    };

    thiz.stopListening = function () {
        _listening = false;
        unsubscribeAREEvents();
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('keydown', keyboardListener);
        document.removeEventListener('keyup', keyUpListener);
        document.removeEventListener('fullscreenchange', fullscreenChangeListener);
        _touchElement.removeEventListener('touchmove', touchMoveListener);
        _touchElement.removeEventListener('touchstart', touchStartListener);
        _touchElement.removeEventListener('touchend', touchEndListener);
    };

    thiz.destroy = function () {
        thiz.stopListening();
        allInstances = allInstances.filter(instance => instance.getID() !== thiz.getID());
    };

    thiz.isListening = function () {
        return _listening;
    };

    thiz.getID = function() {
        return _id;
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

    thiz.onAnyKey = function (fn) {
        return registerHandler(fn, anyKeyHandlers);
    };

    thiz.onTouchMove = function (fn) {
        return registerHandler(fn, touchMoveHandlers);
    };

    thiz.onTouchStart = function (fn) {
        return registerHandler(fn, touchStartHandlers);
    };

    thiz.onTouchEnd = function (fn) {
        return registerHandler(fn, touchEndHandlers);
    };

    thiz.onExitFullscreen = function(fn) {
        return registerHandler(fn, exitFullscreenHandlers);
    };

    thiz.off = function(fn) {
        let filterFn = (f) => f !== fn;
        mouseBorderHandlers = mouseBorderHandlers.filter(filterFn);
        swipeUpHandlers = swipeUpHandlers.filter(filterFn);
        swipeDownHandlers = swipeDownHandlers.filter(filterFn);
        swipeLeftHandles = swipeLeftHandles.filter(filterFn);
        swipeRightHandles = swipeRightHandles.filter(filterFn);
        touchMoveHandlers = touchMoveHandlers.filter(filterFn);
        touchStartHandlers = touchStartHandlers.filter(filterFn);
        touchEndHandlers = touchEndHandlers.filter(filterFn);
        anyKeyHandlers = anyKeyHandlers.filter(filterFn);
    };

    thiz.onInputEvent = function (inputEvent, fn) {
        if (!inputEvent || !fn) {
            return;
        }
        switch (inputEvent.modelName) {
            case InputEventKey.getModelName():
                return registerKey(inputEvent, fn);
            case InputEventARE.getModelName():
                _areInputEvents[inputEvent.id] = {
                    inputEvent: inputEvent,
                    fn: fn
                };
                if (_listening) {
                    subscribeAREEvent(inputEvent, fn);
                }
                break;
        }
    };

    function subscribeAREEvent(inputEvent, fn) {
        areService.subscribeEvents(inputEvent.areURL,(eventString) => {
            if (inputEvent.eventNames.indexOf(eventString) > -1) {
                fn();
            }
        });
    }

    function subscribeAREEvents() {
        Object.keys(_areInputEvents).forEach(key => {
            let entry = _areInputEvents[key];
            subscribeAREEvent(entry.inputEvent, entry.fn);
        });
    }

    function unsubscribeAREEvents() {
        Object.keys(_areInputEvents).forEach(key => {
            let entry = _areInputEvents[key];
            areService.unsubscribeEvents(entry.areURL);
        });
    }

    function registerKey(inputEventKeyInstance, fn) {
        if (!inputEventKeyInstance || !inputEventKeyInstance.keyCode || !fn) {
            return;
        }
        let key = inputEventKeyInstance.keyCode + "";
        let array = keyHandlers[key] ? keyHandlers[key] : [];
        keyHandlers[key] = array;
        array.push(getKeyHandlerEntry(fn, inputEventKeyInstance));
        return thiz;
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
        callHandlers(touchMoveHandlers, [event], true);
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

    function touchEndListener(event) {
        callHandlers(touchEndHandlers, [event], true);
        _touchMoveBeginPosX = null;
        _touchMoveBeginPosY = null;
    }

    function touchStartListener(event) {
        callHandlers(touchStartHandlers, [event], true);
    }

    function keyboardListener(event) {
        let keyCode = event.which || event.keyCode;
        if (anyKeyHandlers.length > 0 && !event.repeat) {
            anyKeyHandlers.forEach(fn => {
                fn(keyCode, event.code, event);
            });
        }
        let key = keyCode + "";
        if (keyHandlers[key]) {
            event.preventDefault();
            if (event.repeat) {
                return;
            }
            let entries = keyHandlers[key];
            entries = entries.sort((a,b) => (a.counter - b.counter) || (a.inputEvent.repeat - b.inputEvent.repeat));
            entries.forEach(entry => {
                entry.inputEvent.timeout = entry.inputEvent.repeat > 1 ? (entry.inputEvent.timeout || 500) : entry.inputEvent.timeout;
                if (timeoutPassed(entry.lastKeydown, entry.inputEvent.timeout)) {
                    entry.counter = 0;
                }
            });
            entries.forEach(entry => {
                let ie = entry.inputEvent;
                if ((!ie.repeat || ie.repeat === 1) && !ie.holdDuration && timeoutPassed(entry.lastAction, ie.timeout)) {
                    let existsConflictingHold = entries.filter(e => e !== entry && e.inputEvent.holdDuration).length > 0;
                    let conflictingRepeat = entries.filter(e => e !== entry && e.inputEvent.repeat > 1);
                    let existsConflictingRepeat = conflictingRepeat.length > 0;
                    let maxConflictingCounter = Math.max.apply(null, conflictingRepeat.map(e => e.counter));
                    if (existsConflictingHold) {
                        entry.doOnKeyup = () => {
                            doEntry(entry);
                        }
                    } else if (existsConflictingRepeat && maxConflictingCounter < 1) {
                        let maxTimeout = Math.max(...conflictingRepeat.map(item => item.inputEvent.timeout));
                        entry.timeoutHandler = setTimeout(() => {
                            doEntry(entry);
                        }, maxTimeout + 10);
                    } else if(!existsConflictingRepeat) {
                        doEntry(entry);
                    }
                } else if (ie.repeat > 1) {
                    entry.counter++;
                    if (entry.counter === ie.repeat) {
                        let existsConflicting = entries.filter(e => e !== entry && e.inputEvent.repeat > ie.repeat).length > 0;
                        let timeout = existsConflicting ? ie.timeout : 0;
                        entry.counter = 0;
                        resetTimeouts(entries);
                        entry.timeoutHandler = setTimeout(() => {
                            doEntry(entry);
                        }, timeout);
                    }
                } else if (ie.holdDuration) {
                    entry.timeoutHandler = setTimeout(() => {
                        doEntry(entry);
                    }, ie.holdDuration);
                }
                entry.lastKeydown = new Date().getTime();
            });

            function doEntry(entry) {
                entry.lastAction = new Date().getTime();
                entry.handler();
                resetEntries(entries);
            }
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
                if (entry.doOnKeyup) {
                    entry.doOnKeyup();
                    resetEntries(entries);
                }
                if (entry.inputEvent.holdDuration) {
                    resetEntry(entry);
                }
            });

        }
    }

    function fullscreenChangeListener() {
        if (!document.fullscreenElement) {
            callHandlers(exitFullscreenHandlers);
        }
    }

    function resetTimeouts(entries) {
        entries.forEach(e => clearTimeout(e.timeoutHandler));
    }

    function resetEntry(entry) {
        clearTimeout(entry.timeoutHandler);
        entry.timeoutHandler = null;
        entry.doOnKeyup = null;
        entry.counter = 0;
    }

    function resetEntries(entries) {
        entries.forEach(e => resetEntry(e));
    }

    function timeoutPassed(lastTimeMs, timeoutMs) {
        if (!lastTimeMs || !timeoutMs) {
            return true;
        }
        return new Date().getTime() - lastTimeMs > timeoutMs;
    }

    function registerHandler(fn, array) {
        if (fn) {
            array.push(fn);
        }
        return thiz;
    }

    function callHandlers(array, argsArray, dontThrottle) {
        array.forEach(handler => {
            if (!handler.apply) {
                log.warn('handler seems to be not a function!')
                return;
            }
            if (dontThrottle) {
                handler.apply(null, argsArray);
            } else {
                util.throttle(() => {
                    handler.apply(null, argsArray);
                });
            }
        });
    }

    return thiz;
}

inputEventHandler.global = inputEventHandler.instance();

export {inputEventHandler};
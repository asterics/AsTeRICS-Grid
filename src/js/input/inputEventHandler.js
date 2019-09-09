import {util} from "../util/util";
import {InputEventKey} from "../model/InputEventKey";
import {InputEventARE} from "../model/InputEventARE";

let inputEventHandler = {};

inputEventHandler.instance = function () {
    let thiz = this;

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
    let keyHandlers = {}; //keycode => handlers array
    let _touchElement = document;

    thiz.startListening = function () {
        document.addEventListener('mousemove', mouseMoveListener);
        document.addEventListener('keydown', keyboardListener);
        _touchElement.addEventListener('touchmove', touchMoveListener);
        _touchElement.addEventListener('touchend', touchEndListener);
    };

    thiz.stopListening = function () {
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('keydown', keyboardListener);
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
        return registerKey(27, fn); //ESC
    };

    thiz.onInputEvent = function (inputEvent, fn) {
        switch (inputEvent.modelName) {
            case InputEventKey.getModelName():
                return registerKey(inputEvent.keyCode, fn);
            case InputEventARE.getModelName():
                //TODO
                break;
        }
    };

    function registerKey(keyCode, fn) {
        if (!keyCode || !fn) {
            return;
        }
        let key = keyCode + "";
        let array = keyHandlers[key] ? keyHandlers[key] : [];
        keyHandlers[key] = array;
        return registerHandler(fn, array);
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
        let keyCode = event.which || event.keyCode;
        let key = keyCode + "";
        if (keyHandlers[key]) {
            callHandlers(keyHandlers[key]);
        }
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
import {util} from "./util";

let inputEventHandler = {};

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
let escapeHandlers = [];
let _touchElement = document;

inputEventHandler.startListening = function () {
    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('keydown', keyboardListener);
    _touchElement.addEventListener('touchmove', touchMoveListener);
    _touchElement.addEventListener('touchend', touchEndListener);
};

inputEventHandler.stopListening = function () {
    document.removeEventListener('mousemove', mouseMoveListener);
    document.removeEventListener('keydown', keyboardListener);
    _touchElement.removeEventListener('touchmove', touchMoveListener);
    _touchElement.removeEventListener('touchend', touchEndListener);
};

inputEventHandler.onMouseUpperOrLeftBorder = function (fn) {
    return registerHandler(fn, mouseBorderHandlers);
};

inputEventHandler.onSwipedDown = function (fn) {
    return registerHandler(fn, swipeDownHandlers);
};

inputEventHandler.onSwipedUp = function (fn) {
    return registerHandler(fn, swipeUpHandlers);
};

inputEventHandler.onSwipedRight = function (fn) {
    return registerHandler(fn, swipeRightHandles);
};

inputEventHandler.onSwipedLeft = function (fn) {
    return registerHandler(fn, swipeLeftHandles);
};

inputEventHandler.onEscape = function (fn) {
    return registerHandler(fn, escapeHandlers);
};

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
    let key = event.which || event.keyCode;
    if (key === 27) { //ESC
        callHandlers(escapeHandlers);
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
    return inputEventHandler;
}

function callHandlers(array) {
    array.forEach(handler => {
        util.throttle(handler);
    });
}

export {inputEventHandler};
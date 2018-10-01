function InputEventHandler() {
    var thiz = this;
    
    // options
    var touchMoveLength = 100;
    var mouseBorderThreshold = 5;
    
    // internal
    var _touchMoveBeginPos = null;
    var _promiseMouseUpperBorder = null;
    var _promiseMouseUpperBorderResolve = null;
    var _promiseSwipeUp = null;
    var _promiseSwipeUpResolve = null;
    var _promiseSwipeDown = null;
    var _promiseSwipeDownResolve = null;

    function initPromises() {
        _promiseMouseUpperBorder = new Promise(function (resolve) {
            _promiseMouseUpperBorderResolve = resolve;
        });
        _promiseSwipeDown = new Promise(function (resolve) {
            _promiseSwipeDownResolve = resolve;
        });
        _promiseSwipeUp = new Promise(function (resolve) {
            _promiseSwipeUpResolve = resolve;
        });
    }

    function resolveMouseUpperBorder() {
        if(_promiseMouseUpperBorderResolve) {
            _promiseMouseUpperBorderResolve();
        }
        _promiseMouseUpperBorder = new Promise(function (resolve) {
            _promiseMouseUpperBorderResolve = resolve;
        });
    }

    function resolveSwipeDown() {
        if(_promiseSwipeDownResolve) {
            _promiseSwipeDownResolve();
        }
        _promiseSwipeDown = new Promise(function (resolve) {
            _promiseSwipeDownResolve = resolve;
        });
    }

    function resolveSwipeUp() {
        if(_promiseSwipeUpResolve) {
            _promiseSwipeUpResolve();
        }
        _promiseSwipeUp = new Promise(function (resolve) {
            _promiseSwipeUpResolve = resolve;
        });
    }

    function mouseMoveListener(event) {
        if(event.clientY < mouseBorderThreshold) {
            resolveMouseUpperBorder();
        }
    }

    function touchMoveListener(event) {
        if(!_touchMoveBeginPos) {
            _touchMoveBeginPos = event.touches[0].clientY;
        } else if (event.touches[0].clientY > _touchMoveBeginPos + touchMoveLength) {
            _touchMoveBeginPos = null;
            resolveSwipeDown();
        } else if (event.touches[0].clientY < _touchMoveBeginPos - touchMoveLength) {
            _touchMoveBeginPos = null;
            resolveSwipeUp();
        }
    }

    function touchEndListener() {
        _touchMoveBeginPos = null;
    }

    thiz.startListening = function () {
        document.addEventListener('mousemove', mouseMoveListener);
        document.addEventListener('touchmove', touchMoveListener);
        document.addEventListener('touchend', touchEndListener);
    };

    thiz.stopListening = function () {
        initPromises();
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('touchmove', touchMoveListener);
        document.removeEventListener('touchend', touchEndListener);
    };

    thiz.waitMouseUpperBorder = function () {
        return _promiseMouseUpperBorder;
    };

    thiz.waitSwipedDown = function () {
        return _promiseSwipeDown;
    };

    thiz.waitSwipedUp = function () {
        return _promiseSwipeUp;
    };

    //start
    initPromises();
    thiz.startListening();
}

export {InputEventHandler};
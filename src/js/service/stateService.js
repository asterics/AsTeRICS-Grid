let stateService = {};
let _states = {};
let _listeners = {};

/**
 * sets a state by key that is valid for this session of the application
 * @param key
 * @param state
 */
stateService.setState = function (key, state) {
    let originalState = _states[key];
    if (originalState !== state) {
        _states[key] = state;
        _listeners[key] = _listeners[key] || [];
        _listeners[key].forEach(fn => {
            fn(state);
        });
    }
};

/**
 * retrieves a state by key that was previously set by stateService.setState()
 * @param key
 * @return {*}
 */
stateService.getState = function (key) {
    return _states[key];
};

/**
 * makes it possible to register a function that is called if the state defined by "key" changes
 * @param key
 * @param fn the listener function (callback) to be called if state changes
 */
stateService.onStateChanged = function (key, fn) {
    _listeners[key] = _listeners[key] || [];
    _listeners[key].push(fn);
};

/**
 * clear listeners previously added with stateService.onStateChanged()
 * @param key
 */
stateService.clearListeners = function (key) {
    if (!key) {
        _listeners = {};
    } else {
        _listeners[key] = [];
    }
};

export {stateService};
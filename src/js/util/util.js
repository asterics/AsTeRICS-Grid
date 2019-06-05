let util = {};

let _timeoutHandlers = {};
util.DEFAULT_KEY = 'DEFAULT_KEY';
util.DEFAULT_KEY2 = 'DEFAULT_KEY2';

/**
 * Calls the given function after a specified timeout. Another subsequent call cancels and restarts the timeout.
 *
 * @param fn the function to call
 * @param timeout
 * @param key for identifying the called function. If several functions are debounced at the same time, different keys
 *        have to be specified for identifying them
 */
util.debounce = function (fn, timeout, key) {
    key = key || util.DEFAULT_KEY;
    if (!fn && !timeout) {
        log.warn('called util.debounce() without needed parameters. aborting.');
        return;
    }
    if (_timeoutHandlers[key]) {
        clearTimeout(_timeoutHandlers[key]);
    }
    _timeoutHandlers[key] = setTimeout(function () {
        fn();
    }, timeout);
};

export {util};
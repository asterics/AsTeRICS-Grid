let util = {};

let _timeoutHandlers = {};
let _throttleHistory = {}; //fn -> lastCallTime
let lastClipboardData = '';
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

/**
 * Throttles a high call rate on a given function.
 *
 * @param fn the function to call
 * @param args the arguments to pass to the function to call
 * @param minPauseMs minimum pause in milliseconds between two function calls of the same function. If last call
 *        was more than minPausMs ago, the given function is called, otherwise the function call is discarded.
 */
util.throttle = function (fn, args, minPauseMs) {
    if (!fn || !fn.apply) {
        return;
    }
    minPauseMs = minPauseMs || 500;
    let lastCall = _throttleHistory[fn];
    if (!lastCall || new Date().getTime() - lastCall > minPauseMs) {
        fn.apply(null, args);
        _throttleHistory[fn] = new Date().getTime();
    }
};

/**
 * copies the given text to clipboard
 * @param text
 */
util.copyToClipboard = function copyTextToClipboard(text) {
    let textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        lastClipboardData = text;
        log.debug('Copying text command was ' + msg);
    } catch (err) {
        log.warn('Unable to copy to clipboard.');
    }
    document.body.removeChild(textArea);
};

/**
 * appends a given text to clipboard.
 * Note: only works for subsequent calls on util.copyToClipboard() or util.appendToClipboard() since the real
 * clipboard content cannot be retrieved and only the values of previous calls of these functions will be used
 * to append the text.
 *
 * @param text the string to append to the clipboard
 */
util.appendToClipboard = function (text) {
    util.copyToClipboard(lastClipboardData + text);
};

export {util};
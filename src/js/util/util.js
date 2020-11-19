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
 * clears any existing timeout created by "debounce()" before by given key
 * @param key
 */
util.clearDebounce = function (key) {
    key = key || util.DEFAULT_KEY;
    if (_timeoutHandlers[key]) {
        clearTimeout(_timeoutHandlers[key]);
    }
};

/**
 * Throttles a high call rate on a given function.
 *
 * @param fn the function to call
 * @param args the arguments to pass to the function to call
 * @param minPauseMs minimum pause in milliseconds between two function calls of the same function. If last call
 *        was more than minPausMs ago, the given function is called, otherwise the function call is discarded.
 * @param key unique key to identify the given function (optional)
 */
util.throttle = function (fn, args, minPauseMs, key) {
    if (!fn || !fn.apply) {
        return;
    }
    minPauseMs = minPauseMs || 500;
    let historyKey = key || fn;
    let lastCall = _throttleHistory[historyKey];
    if (!lastCall || new Date().getTime() - lastCall > minPauseMs) {
        fn.apply(null, args);
        _throttleHistory[historyKey] = new Date().getTime();
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

/**
 * reads the clipboard content using navigator API
 * returns null if failed or permission was not granted.
 * @return Promise
 */
util.getClipboardContent = function () {
    return navigator.clipboard.readText()
        .then(text => {
            return Promise.resolve(text);
        })
        .catch(err => {
            log.warn('failed to read clipboard.');
            return Promise.resolve(null);
        });
};

/**
 * gets an element by given x/y coordinates in the current window
 *
 * @param possibleElements list of possible elements to return
 * @param x x-coordinate in the current window to get the element
 * @param y y-coordinate in the current window to get the element
 */
util.getElement = function (possibleElements, x, y) {
    let baseElements = document.elementsFromPoint(x, y);
    let element = null;
    baseElements.forEach(baseElement => {
        element = element || getParentElement(baseElement, possibleElements);
    });
    return element;

    function getParentElement(element, possibleElementsParam) {
        for (let i = 0; element && possibleElementsParam.indexOf(element) === -1 && i < 100; i++) {
            element = element.parentElement;
        }
        return element;
    }
};

/**
 * splits an array into smaller chunks, see https://stackoverflow.com/questions/8495687/split-array-into-chunks
 * @param array
 * @param chunkSize
 * @return {[]}
 */
util.splitInChunks = function (array, chunkSize) {
    let R = [];
    for (let i = 0, len = array.length; i < len; i += chunkSize)
        R.push(array.slice(i, i + chunkSize));
    return R;
};

util.openFullscreen = function () {
    let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let elem = isSafari ? document.documentElement : document.body;
    let openFn = elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
    if (openFn) {
        openFn.call(elem);
    }
};

util.closeFullscreen = function () {
    if (!document.fullscreenElement) {
        return;
    }
    let closeFn = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (closeFn) {
        closeFn.call(document);
    }
};

/**
 * converts HEX or CSS RGB string to RGB array
 * @param hexOrCssRGB
 * @return {null|*[]}
 */
util.getRGB = function (hexOrCssRGB) {
    if (hexOrCssRGB && hexOrCssRGB[0] === '#') {
        return util.hexToRGB(hexOrCssRGB);
    } else if (hexOrCssRGB && hexOrCssRGB.indexOf('rgb') === 0) {
        return util.cssRGBToRGB(hexOrCssRGB);
    }
    return null;
}

/**
 * converts HEX String to array[3] with RGB colors
 * @param hex
 * @return {null|*[]}
 */
util.hexToRGB = function (hex) {
    if (!hex) {
        return null;
    }
    let array = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
        , (m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map(x => parseInt(x, 16));
    return array[0] && array[1] && array[2] ? array : null;
}

/**
 * converts css RGB String (e.g. 'rgb(123, 123, 123)') to RGB array, e.g. [123, 123, 123]
 * @param cssRGB
 * @return {null|*[]}
 */
util.cssRGBToRGB = function (cssRGB) {
    if (!cssRGB) {
        return null;
    }
    let array = cssRGB.match(/[0-9.]+/gi).map(string => parseInt(string));
    return array[0] && array[1] && array[2] ? array : null;
}


export {util};
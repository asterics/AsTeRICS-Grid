import { TextConfig } from '../model/TextConfig.js';

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
    let textArea = document.createElement('textarea');
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
    return navigator.clipboard
        .readText()
        .then((text) => {
            return Promise.resolve(text);
        })
        .catch((err) => {
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
    baseElements.forEach((baseElement) => {
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
    for (let i = 0, len = array.length; i < len; i += chunkSize) R.push(array.slice(i, i + chunkSize));
    return R;
};

util.openFullscreen = function () {
    let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let elem = isSafari ? document.documentElement : document.body;
    let openFn =
        elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
    if (openFn) {
        openFn.call(elem);
    }
};

util.closeFullscreen = function () {
    if (!document.fullscreenElement) {
        return;
    }
    let closeFn =
        document.exitFullscreen ||
        document.mozCancelFullScreen ||
        document.webkitExitFullscreen ||
        document.msExitFullscreen;
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
};

/**
 * converts HEX String to array[3] with RGB colors
 * @param hex
 * @return {null|*[]}
 */
util.hexToRGB = function (hex) {
    if (!hex) {
        return null;
    }
    let array = hex
        .replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1)
        .match(/.{2}/g)
        .map((x) => parseInt(x, 16));
    return !array.some(isNaN) ? array : null;
};

/**
 * converts css RGB String (e.g. 'rgb(123, 123, 123)') to RGB array, e.g. [123, 123, 123]
 * @param cssRGB
 * @return {null|*[]}
 */
util.cssRGBToRGB = function (cssRGB) {
    if (!cssRGB) {
        return null;
    }
    let array = cssRGB.match(/[0-9.]+/gi).map((string) => parseInt(string));
    return array[0] && array[1] && array[2] ? array : null;
};

util.sleep = function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

util.isString = function (value) {
    return typeof value === 'string' || value instanceof String;
};

util.convertLowerUppercase = function (text, convertMode) {
    if (!convertMode || !text) {
        return text;
    } else if (convertMode === TextConfig.CONVERT_MODE_LOWERCASE) {
        return text.toLowerCase();
    } else if (convertMode === TextConfig.CONVERT_MODE_UPPERCASE) {
        return text.toUpperCase();
    }
};

/**
 * returns the current date and time as formatted string like 2023-01-16_15-56
 * @return {string}
 */
util.getCurrentDateTimeString = function () {
    let d = new Date();
    let pad = (v) => `0${v}`.slice(-2);
    let datestring = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(
        d.getMinutes()
    )}`;
    return datestring;
};

//see https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
util.arrayBufferToBase64 = function (buffer) {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

/*
Utility functions for base64 encoding, see: https://developer.mozilla.org/en-US/docs/Glossary/Base64
*/
/**
 * Converts the given string value into a base64 encoded string.
 * @param {*} str 
 * @returns base64 encoded string
 */
util.stringToBase64 = function (str) {
    // Usage
    return util.bytesToBase64(new TextEncoder().encode(str));
};

/**
 * Converts the given base64 string into a decoded string value.
 * @param {*} base64 
 * @returns decoded base64 string
 */
util.base64ToString = function (base64) {
    return new TextDecoder().decode(util.base64ToBytes(base64));
};

/**
 * Converts a given base64 string into a Uint8Array of bytes.
 * @param {*} base64 
 * @returns Uint8Array 
 */
util.base64ToBytes = function (base64) {
    const binString = window.atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
};

/**
 * Converts the given bytes (Uint8Array) into a base64 encoded string.
 * @param {*} bytes 
 * @returns 
 */
util.bytesToBase64 = function (bytes) {
    const binString = String.fromCodePoint(...bytes);
    return window.btoa(binString);
};

/**
 * formats an array to be printable to UI
 * e.g. ["1", "2", "3"] => string '1, 2, 3'
 * @param array
 */
util.arrayToPrintable = function (array) {
    return JSON.stringify(array).replaceAll('[', '').replaceAll(']', '').replaceAll('"', '');
};

util.mapRange = function (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

util.fetchWithTimeout = function (url, timeoutMs) {
    // see https://stackoverflow.com/a/50101022/9219743
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    return fetch(url, { signal: controller.signal });
}

/**
 * Returns a random float number between min (inclusive) and max (exclusive)
 * see https://stackoverflow.com/a/1527820
 */
util.getRandom = function (min, max) {
    return Math.random() * (max - min) + min;
}

util.deduplicateArray = function (array) {
    return [...new Set(array)];
}

// https://stackoverflow.com/a/2450976/9219743
util.shuffleArray = function (array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

util.getFilledArray = function(sizeX, sizeY, value) {
    let baseArray = new Array(sizeX);
    for (let x = 0; x < sizeX; x++) {
        baseArray[x] = new Array(sizeY).fill(value);
    }
    return baseArray;
};

export { util };

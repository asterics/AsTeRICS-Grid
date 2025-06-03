import { MapCache } from './MapCache';

var fontUtil = {};
var lastSize = '20px';

let FONT_ADAPT_MAX_ROUNDS = 5;
let hexToHslCache = new MapCache();

/**
 * returns the optimal font size in px for a given grid element
 * @param elem
 * @return {*}
 */
fontUtil.getFontSizePx = function (elem, oneLine) {
    let label = getLabel(elem);
    let elementType = elem.attr('data-type');
    let imageId = elem.attr('data-img-id');
    if (!label) {
        return '10px';
    }

    var rectElem = elem[0].getBoundingClientRect();
    var areaElem = (rectElem.height * rectElem.width) / (imageId ? 2 : 1);
    var fontSize1 = Math.floor(Math.sqrt((areaElem * 0.5) / Math.max(15, label.length)));
    var longestWordLength = oneLine
        ? label.length
        : Math.max.apply(
              null,
              label.split(' ').map((elem) => elem.length)
          );
    var fontSize2 = (1.4 * rectElem.width) / longestWordLength;
    fontSize2 = !oneLine ? fontSize2 : Math.min(fontSize2, 30);
    lastSize = Math.min(fontSize1, fontSize2);
    if (lastSize > rectElem.height / 3) {
        lastSize = rectElem.height * 0.3;
    }
    if (label.length === 1 && elementType === 'ELEMENT_TYPE_NORMAL') {
        lastSize *= 2;
    }
    return lastSize + 'px';
};

/**
 * adapts font size on one or several elements
 */
fontUtil.adaptFontSize = function (elems) {
    for (var i = 0; i < elems.length; i++) {
        let oneLine = false;
        var elem = elems[i];
        var textContainerElem = $(elem).find('.text-container')[0];
        if (textContainerElem) {
            textContainerElem.style.fontSize = fontUtil.getFontSizePx($(elem), oneLine);
        }
        let hintElems = $(elem).find('.element-hint');
        let fontPx = Math.min($(elem).width() / 10, 30);
        fontPx = fontPx < 5 ? 0 : fontPx;
        hintElems.css('fontSize', fontPx + 'px');
    }
};

/**
 * adapts font size for all grid elements
 */
fontUtil.adaptFontSizeForGridElements = function () {
    fontUtil.adaptFontSize($('#grid-container .item'));
};

/**
 * returns the last calculated fontSize in px (e.g. "20px")
 */
fontUtil.getLastFontSize = function () {
    return lastSize + 'px';
};

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text The text to be rendered.
 * @param {DOMElement} containerElem the element containing the text, default document.body
 * @param {String | Number} targetSize the optional targetSize of the text, e.g. "16px", if a number is passed it's interpreted as "px"
 * @param {Object} options
 * @param {String} options.fontWeight the font weight, e.g. "bold" or 700, default: "bold"
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
fontUtil.getTextWidth = function(text, containerElem, targetSize, options = {}) {
    options.fontWeight = options.fontWeight || 'bold';
    containerElem = containerElem || document.body;
    targetSize = typeof targetSize === 'number' ? targetSize + 'px' : targetSize;
    let font = getCanvasFontSize(containerElem, targetSize, options.fontWeight);
    // re-use canvas object for better performance
    const canvas = fontUtil.getTextWidth.canvas || (fontUtil.getTextWidth.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
};

/**
 * returns a fitting font size for the given text and container in px
 * @param text
 * @param container
 * @param options
 * @param options.padding padding on left and right of the text in px, defaults to 5
 * @param options.maxLines maximum number of lines allowed, defaults to 1
 * @param options.containerPct percentage of the container width to be filled, range from 0..100, defaults to 100
 * @param options.maxSize maximum size allowed
 * @param options.lineHeight the used line height
 * @param options.containerSize pass container size in order to prevent re-calculation (performance)
 * @returns {number} font size in px
 */
fontUtil.getFittingFontSize = function(text, container, options = {}) {
    if(!container || !text) {
        return 0;
    }
    options.padding = options.padding === undefined ? 5 : options.padding;
    options.maxLines = options.maxLines || 1;
    options.containerPct = options.containerPct || 100;
    options.maxSize = options.maxSize || Number.MAX_SAFE_INTEGER;
    options.lineHeight = options.lineHeight || 1;
    let tryPx = 14;
    let width = fontUtil.getTextWidth(text, container, tryPx);
    let maxWH = Math.max(width, tryPx);
    let containerSize = options.containerSize || container.getBoundingClientRect();
    let containerWidth = Math.max(0, containerSize.width * (options.containerPct / 100) - 2 * options.padding) * options.maxLines;

    if (options.maxLines > 1) {
        // ensure fontSize small enough that longest word fits in one line
        let words = text.split(' ');
        let lengths = words.map(word => word.length);
        let maxLength = Math.max.apply(null, lengths);
        let longestWord = words.find(word => word.length === maxLength);
        let newOptions = JSON.parse(JSON.stringify(options));
        newOptions.maxLines = 1;
        options.maxSize = Math.min(options.maxSize, fontUtil.getFittingFontSize(longestWord, container, newOptions));
        containerWidth = containerWidth * 0.9;
    }
    let count;
    for (count = 0; count < FONT_ADAPT_MAX_ROUNDS && Math.abs(maxWH - containerWidth) > 1; count++) {
        let factor = maxWH / containerWidth;
        tryPx = tryPx / factor;
        width = fontUtil.getTextWidth(text, container, tryPx);
        maxWH = Math.max(width, tryPx);
    }
    if (maxWH > containerWidth) {
        tryPx -= 0.5;
        tryPx = Math.floor(tryPx);
    }
    return Math.min(options.maxSize, tryPx, (containerSize.height * options.containerPct / 100) / options.lineHeight);
}

/**
 * converts a percent value to px. percent value is in relation to the given size parameter (mean of width and height).
 * @param pct
 * @param containerSize the size of the container the percent value refers to, default: current viewport size
 */
fontUtil.pctToPx = function(pct, containerSize) {
    containerSize = containerSize || {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
    }
    //return (containerSize.width + containerSize.height) * pct / 200;
    return containerSize.height * pct / 100;
}

fontUtil.getHighContrastColor = function(hexBackground, lightColor, darkColor) {
    if (!hexBackground || !hexBackground.startsWith('#')) {
        return '';
    }
    lightColor = lightColor || constants.COLORS.WHITE;
    darkColor = darkColor || constants.colors.BLACK;
    let rgb = hexToRgb(hexBackground);
    return fontUtil.getHighContrastColorRgb(rgb, lightColor, darkColor);
};

fontUtil.getHighContrastColorRgb = function(rgb, lightColor, darkColor) {
    lightColor = lightColor || [255, 255, 255];
    darkColor = darkColor || [0, 0, 0];
    if(!rgb){
        return lightColor;
    }
    if (rgb.r === undefined && rgb.length) {
        rgb = {
            r: rgb[0],
            g: rgb[1],
            b: rgb[2]
        };
    }
    if (fontUtil.isRGBDark(rgb)) {
        return lightColor;
    } else {
        return darkColor;
    }
};

fontUtil.isHexDark = function(hex) {
    let rgb = hexToRgb(hex);
    return fontUtil.isRGBDark(rgb);
};

fontUtil.isRGBDark = function(rgb) {
    let val = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
    return val <= 149;
}

fontUtil.adjustHexColor = function(hexString, percent, returnHex = false) {
    let hslObject = hexToHSL(hexString);
    let adjustedHsl = fontUtil.adjustHSLColor(hslObject, percent);
    if (returnHex) {
        return hslToHex(adjustedHsl);
    } else {
        return `hsl(${adjustedHsl.h}, ${adjustedHsl.s}%, ${adjustedHsl.l}%)`;
    }
};

window.adjustHexColor = fontUtil.adjustHexColor;

fontUtil.adjustHSLColor = function(hslObject, percent) {
    hslObject.l = Math.min(100, Math.max(0, hslObject.l * (1 + percent/100)));
    return hslObject;
};

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        }
        : hex;
}

function hexToHSL(hex, returnValues = false) {
    if (hexToHslCache.has(hex)) {
        return hexToHslCache.get(hex);
    }
    let rgb = hexToRgb(hex);
    let r = rgb.r;
    let g = rgb.g;
    let b = rgb.b;

    (r /= 255), (g /= 255), (b /= 255);
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    let hsl = {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
    hexToHslCache.set(hex, hsl);
    return hsl;
}

// https://stackoverflow.com/a/44134328/9219743
function hslToHex(hslObject) {
    let h = hslObject.h, l = hslObject.l, s = hslObject.s;
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFontSize(el = document.body, fontSize, weight) {
    const fontWeight = weight || getCssStyle(el, 'font-weight') || 'normal';
    fontSize = fontSize || getCssStyle(el, 'font-size') || '16px';
    const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';

    return `${fontWeight} ${fontSize} ${fontFamily}`;
}

function getLabel(elem) {
    if (elem.attr('data-label')) {
        return elem.attr('data-label').trim();
    }
    if ($(elem).find('.text-container span').text().trim()) {
        return $(elem).find('.text-container span').text().trim();
    }
    if ($(elem).find('.collect-container').text().trim()) {
        return $(elem).find('.collect-container').text().trim();
    }
    return '';
}

export { fontUtil };

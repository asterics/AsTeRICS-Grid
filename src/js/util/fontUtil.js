var fontUtil = {};
var lastSize = '20px';

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
 * @param {String} targetSize the optional targetSize of the text, e.g. "16px"
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
fontUtil.getTextWidth = function (text, containerElem, targetSize) {
    containerElem = document.body || containerElem;
    let font = getCanvasFontSize(containerElem, targetSize);
    // re-use canvas object for better performance
    const canvas = fontUtil.getTextWidth.canvas || (fontUtil.getTextWidth.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
};

fontUtil.getHighContrastColor = function (hexBackground, lightColor, darkColor) {
    if (!hexBackground || !hexBackground.startsWith('#')) {
        return '';
    }
    lightColor = lightColor || '#ffffff';
    darkColor = darkColor || '#000000';
    let rgb = hexToRgb(hexBackground);
    let val = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
    if (val > 149) {
        return darkColor;
    } else {
        return lightColor;
    }
};

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
          }
        : null;
}

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFontSize(el = document.body, fontSize) {
    const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
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

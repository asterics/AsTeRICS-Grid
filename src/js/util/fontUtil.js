var fontUtil = {};
var lastSize = '20px';

/**
 * returns the optimal font size in px for a given grid element
 * @param elem
 * @return {*}
 */
fontUtil.getFontSizePx = function (elem, oneLine) {
    var label = getLabel(elem);
    var imageId = elem.attr('data-img-id');
    if (!label) {
        return "10px";
    }

    var rectElem = elem[0].getBoundingClientRect();
    var areaElem = rectElem.height * rectElem.width / (imageId ? 2 : 1);
    var fontSize1 = Math.floor(Math.sqrt(areaElem * 0.5 / Math.max(15, label.length)));
    var longestWordLength = oneLine ? label.length : Math.max.apply(null, label.split(' ').map(elem => elem.length));
    var fontSize2 = 1.4 * rectElem.width / longestWordLength;
    fontSize2 = !oneLine ? fontSize2 : Math.min(fontSize2, 30);
    lastSize = Math.min(fontSize1, fontSize2) + "px";
    return lastSize;
};

/**
 * adapts font size on one or several elements
 */
fontUtil.adaptFontSize = function (elems) {
    for (var i = 0; i < elems.length; i++) {
        let oneLine = false;
        var elem = elems[i];
        var textContainerElem = $(elem).find('.text-container')[0];
        if (!textContainerElem) {
            textContainerElem = $(elem).find('textarea')[0];
            oneLine = true;
        }
        if (textContainerElem) {
            textContainerElem.style.fontSize = fontUtil.getFontSizePx($(elem), oneLine);
        }
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
    return lastSize;
};

function getLabel(elem) {
    if (elem.attr('data-label')) {
        return elem.attr('data-label');
    }
    if ($(elem).find('.text-container span').text()) {
        return $(elem).find('.text-container span').text()
    }
    if ($(elem).find('textarea')[0]) {
        return $(elem).find('textarea')[0].value;
    }
    return "";
}

export {fontUtil};
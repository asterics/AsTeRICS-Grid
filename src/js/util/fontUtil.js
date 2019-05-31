var fontUtil = {};
var lastSize = '20px';

/**
 * returns the optimal font size in px for a given grid element
 * @param elem
 * @return {*}
 */
fontUtil.getFontSizePx = function (elem) {
    var label = elem.attr('data-label') || $(elem).find('.text-container span').text();
    var imageId = elem.attr('data-img-id');
    if (!label) {
        return "10px";
    }

    var rectElem = elem[0].getBoundingClientRect();
    var areaElem = rectElem.height * rectElem.width / (imageId ? 2 : 1);
    var fontSize1 = Math.floor(Math.sqrt(areaElem * 0.5 / Math.max(15, label.length)));
    var longestWordLength = Math.max.apply(null, label.split(' ').map(elem => elem.length));
    var fontSize2 = 1.4 * rectElem.width / longestWordLength;
    lastSize = Math.min(fontSize1, fontSize2) + "px";
    return lastSize;
};

/**
 * adapts font size on one or several elements
 */
fontUtil.adaptFontSize = function (elems) {
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        var textContainerElem = $(elem).find('.text-container')[0];
        if (textContainerElem) {
            textContainerElem.style.fontSize = fontUtil.getFontSizePx($(elem));
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

export {fontUtil};
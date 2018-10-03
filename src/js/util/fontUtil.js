var fontUtil = {};

/**
 * returns the optimal font size in px for a given grid element
 * @param elem
 * @return {*}
 */
fontUtil.getFontSizePx = function (elem) {
    var label = elem.attr('data-label');
    var imageId = elem.attr('data-img-id');
    if (!label) {
        return "10px";
    }

    var rectElem = elem[0].getBoundingClientRect();
    var areaElem = rectElem.height * rectElem.width / (imageId ? 2 : 1);
    var fontSize = Math.floor(Math.sqrt(areaElem * 0.5 / Math.max(10, label.length)));

    return Math.min(fontSize, rectElem.height / 2) + "px";
};

/**
 * adapts font size on one or several elements
 */
fontUtil.adaptFontSize = function (elems) {
    for(var i=0; i<elems.length; i++) {
        var elem = elems[i];
        $(elem).find('.text-container')[0].style.fontSize = fontUtil.getFontSizePx($(elem));
    }

};

/**
 * adapts font size for all grid elements
 */
fontUtil.adaptFontSizeForGridElements = function() {
    fontUtil.adaptFontSize($('#grid-container .item'));
};

export {fontUtil};
var fontUtil = {};

/**
 * returns font size in percent for a grid element by parameters of the element
 *
 * @param label
 * @param width
 * @param height
 * @param image
 * @return {string} the string that can be used for font-size css property, e.g. "70%"
 */
fontUtil.getFontSizePercent = function(label, width, height, image) {
    var lineLength = width * 5;
    var imgFactor = image ? 1 : 0;
    var maxLines = 2*height-(height*imgFactor);
    if(!label || label.length < lineLength * maxLines) {
        return "100%";
    }

    var tooBigFactor = label.length / (lineLength * maxLines);
    return (100 * Math.exp(-tooBigFactor/4)) + '%';
};

/**
 * adapts font size on one or several elements
 * @param elemOrElems a NodeList (result of jquery query) or a single element
 * @param maxH maximum height of element (numberOfRows of the grid)
 * @param w current element width (optional if data-h is incorrect)
 * @param h current element height (optional if data-w is incorrect)
 */
fontUtil.adaptFontSize = function (elemOrElems, maxH, w, h) {
    var elems = elemOrElems instanceof NodeList ? elemOrElems : [elemOrElems];
    for(var i=0; i<elems.length; i++) {
        var elem = elems[i];
        w = w || elem.attr('data-w');
        h = h || elem.attr('data-h');
        h = Math.min(h, maxH);
        elem.find('.text-container')[0].style.fontSize = fontUtil.getFontSizePercent(elem.attr('data-label'), w, h,  elem.attr('data-img-id'));
    }

};

export {fontUtil};
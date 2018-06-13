import {templates} from "../templates";

var idCounter = 1;

function GridElement(options) {
    var thiz = this;

    //options
    var internalOptions = {
        id: new Date().getTime() + "-" + (idCounter++),
        width: 2,
        height: 1,
        x: 0,
        y: 0,
        speakText: null,
        label: null
    };

    function parseOptions(options) {
        if (options) {
            internalOptions.width = options.width || internalOptions.width;
            internalOptions.height = options.height || internalOptions.height;
            internalOptions.x = options.x || internalOptions.x;
            internalOptions.y = options.y || internalOptions.y;
            internalOptions.speakText = options.speakText || internalOptions.speakText;
            internalOptions.label = options.label || internalOptions.label;
        }
    }

    function init() {
        parseOptions(options);
    }
    init();

    thiz.getId = function () {
        return internalOptions.id;
    };

    thiz.toJSON = function () {
        return internalOptions;
    };

    thiz.toHTML = function () {
        return templates.getGridItem(internalOptions.label, internalOptions.width, internalOptions.height, internalOptions.x, internalOptions.y, internalOptions.id);
    };
}

var GridElementConverter = {
    gridListItemToGridElement: function (gridListItem) {
        var htmlElement = gridListItem.$element;
        return new GridElement({
            width: gridListItem.w,
            height: gridListItem.h,
            speakText: htmlElement.data('speak-text'),
            label: htmlElement.data('label')
        });
    }
};

export {GridElement, GridElementConverter};
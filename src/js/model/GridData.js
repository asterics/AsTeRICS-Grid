var idCounter = 1;

function GridData(options) {
    var thiz = this;

    var internalOptions = {
        id: new Date().getTime() + "-" + (idCounter++),
        label: null,
        gridElements: []
    };

    function parseOptions(options) {
        if (options) {
            internalOptions.label = options.label || internalOptions.label;
            internalOptions.gridElements = options.gridElements || internalOptions.gridElements;
        }
    }

    function init() {
        parseOptions(options);
    }
    init();

    thiz.addGridElement = function(gridElement) {
        internalOptions.gridElements.push(gridElement);
    };

    thiz.getGridElements = function() {
        return internalOptions.gridElements;
    };

    thiz.toJSON = function () {
        return internalOptions;
    }
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
    },
    gridElementToHtml: function () {

    }
};

export {GridData, GridElementConverter};
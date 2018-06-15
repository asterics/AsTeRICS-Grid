import {modelUtil} from "../util/modelUtil";
import {templates} from "../templates";

class GridElement extends Model({
    id: String,
    width: Number,
    height: Number,
    x: [Number],
    y: [Number],
    speakText: [String],
    label: [String]
}) {
    constructor(...args) {
        super(...args);
        this.id = modelUtil.generateId('grid-element')
    }

    toHTML() {
        return templates.getGridItem(this.label, this.width, this.height, this.x, this.y, this.id);
    };

    hasSetPosition() {
        return this.x != null && this.x != undefined && this.y != null && this.y != undefined;
    }

    static fromJSON(jsonData) {
        var result = [];
        var data = typeof jsonData === 'string' ? JSON.parse(jsonData): jsonData;
        if(!(data instanceof Array)) {
            data = [data];
        }
        data.forEach(function (item) {
            result.push(new GridElement(item));
        });

        return result.length == 1 ? result[0] : result;
    }
}

GridElement.defaults({
    id: "", //will be replaced by constructor
    width: 2,
    height: 1
});

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
import {modelUtil} from "../util/modelUtil";
import {templates} from "../templates";
import {GridImage} from "./GridImage";

class GridElement extends Model({
    id: String,
    width: Number,
    height: Number,
    x: [Number],
    y: [Number],
    label: [String],
    image: [GridImage]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridElement);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-element')
    }

    duplicate() {
        var newElem = new GridElement(JSON.parse(JSON.stringify(this)));
        newElem.id = modelUtil.generateId('grid-element');
        return newElem;
    }

    toHTML() {
        return templates.getGridItem(this.label, this.width, this.height, this.x, this.y, this.id, this.image);
    };

    hasSetPosition() {
        return this.x != null && this.x != undefined && this.y != null && this.y != undefined;
    }
}

GridElement.defaults({
    id: "", //will be replaced by constructor
    width: 2,
    height: 1
});

export {GridElement};
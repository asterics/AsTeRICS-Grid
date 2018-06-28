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
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridElement);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-element')
    }

    toHTML() {
        return templates.getGridItem(this.label, this.width, this.height, this.x, this.y, this.id);
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
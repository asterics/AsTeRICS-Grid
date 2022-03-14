import {GridElement} from "./GridElement.js";

class GridElementCollect extends GridElement.extend({
    showLabels: [Boolean],
    imageHeightPercentage: [Number],
    mode: [String]
}) {
    constructor(props) {
        props = props || {};
        props.showLabels = true;
        props.imageHeightPercentage = 85;
        props.mode = GridElementCollect.MODE_AUTO;
        props.type = GridElement.ELEMENT_TYPE_COLLECT;
        super(props);
    }
}

GridElementCollect.MODE_AUTO = 'MODE_AUTO';
GridElementCollect.MODE_ONLY_SYMBOLS = 'MODE_ONLY_SYMBOLS';
GridElementCollect.MODE_ONLY_TEXT = 'MODE_ONLY_TEXT';
GridElementCollect.MODES = [GridElementCollect.MODE_AUTO, GridElementCollect.MODE_ONLY_SYMBOLS, GridElementCollect.MODE_ONLY_TEXT];

export {GridElementCollect};
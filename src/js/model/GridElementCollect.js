import {GridElement} from "./GridElement.js";

class GridElementImageCollect extends GridElement.extend({
    showLabels: [Boolean],
    imageHeightPercentage: [Number]
}) {
    constructor(props) {
        props = props || {};
        props.showLabels = true;
        props.imageHeightPercentage = 85;
        props.type = GridElement.ELEMENT_TYPE_COLLECT_IMAGE;
        super(props);
    }
}

export {GridElementImageCollect};
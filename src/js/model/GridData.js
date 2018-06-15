import {modelUtil} from "../util/modelUtil";
import {GridElement} from "./GridElement";
import Model from "objectmodel"

class GridData extends Model({
    id: String,
    label: [String],
    gridElements: Model.Array(GridElement)
}) {
    constructor(...args) {
        super(...args);
        this.id = modelUtil.generateId('grid-data')
    }
}

GridData.defaults({
    id: "", //will be replaced by constructor
});

export {GridData};
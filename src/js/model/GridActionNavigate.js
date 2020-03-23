import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionNavigate extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    toGridId: [String],
    toLastGrid: [Boolean]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionNavigate);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-navigate')
    }

    static getModelName() {
        return "GridActionNavigate";
    }
}

GridActionNavigate.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionNavigate.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {GridActionNavigate};
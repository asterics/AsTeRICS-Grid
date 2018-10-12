import {modelUtil} from "../util/modelUtil";

class GridActionNavigate extends Model({
    id: String,
    modelName: String,
    toGridId: [String]
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
    modelName: GridActionNavigate.getModelName()
});

export {GridActionNavigate};
import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionARE extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    areURL: [String],
    areModelGridFileName: [String], //name of AdditionalGridFile stored in parent GridData element
    componentId: [String],
    dataPortId: [String],
    dataPortSendData: [String],
    eventPortId: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionARE);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-are')
    }

    static getModelName() {
        return "GridActionARE";
    }
}

GridActionARE.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionARE.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {GridActionARE};
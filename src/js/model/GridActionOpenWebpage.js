import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionOpenWebpage extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    openURL: [String],
    timeoutSeconds: [Number]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionOpenWebpage);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridActionOpenWebpage.getModelName())
    }

    static getModelName() {
        return "GridActionOpenWebpage";
    }
}

GridActionOpenWebpage.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionOpenWebpage.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    timeoutSeconds: 0
});

export {GridActionOpenWebpage};
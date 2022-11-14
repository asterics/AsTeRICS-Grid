import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";
import {i18nService} from "../service/i18nService";

class GridActionOpenHAB extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    openHABUrl: [String],
    openHABAction: [String],
    openHABActionType: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionOpenHAB);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-openHAB')
    }

    static getModelName() {
        return "GridActionOpenHAB";
    }
}

GridActionOpenHAB.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionOpenHAB.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    openHABUrl: null
});

export {GridActionOpenHAB};
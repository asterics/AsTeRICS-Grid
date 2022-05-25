import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionTurnOnShelly extends Model({
    id: String,
    modelName: String,
    modelVersion: String,

    shellyIP: [String],
    turn: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionTurnOnShelly);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-turn-on-shelly')
        // this.id = this.id || modelUtil.generateId(GridActionOpenWebpage.getModelName())  /
    }

    static getModelName() {
        return "GridActionTurnOnShelly";
    }
}

GridActionTurnOnShelly.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionTurnOnShelly.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {GridActionTurnOnShelly};
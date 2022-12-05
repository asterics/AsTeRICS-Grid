import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionOpenHAB extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    openHABUrl: [String],
    itemType: [String], //Dimmer, Switch, ... itemType
    itemName: [String], //itemName
    actionType: [String], //ON, OFF, CUSTOM_VALUE ... actionType
    actionValue: [String] //HSL, 0-100, ... (optional)

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
    actionValue: '0',
    itemType: '', //Dimmer, Switch, ... itemType
    itemName: '', //itemName
    actionType: '' //ON, OFF, CUSTOM_VALUE ... actionType
});

export {GridActionOpenHAB};
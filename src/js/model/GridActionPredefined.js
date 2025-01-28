import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionPredefined extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    groupId: [String], // e.g. Shelly Plus Plug S, Valetudo etc.
    actionInfo: [Object], // infos about types, default values etc. of custom values
    customValues: [Object] // key -> value pairs
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionPredefined);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridActionPredefined.getModelName());
    }

    static getModelName() {
        return 'GridActionPredefined';
    }
}

GridActionPredefined.canBeTested = true;

GridActionPredefined.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionPredefined.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    customValues: {}
});

export { GridActionPredefined };

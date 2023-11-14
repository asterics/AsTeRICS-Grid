import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionPuckJS extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    puckjsCmd: [String],
    timeoutSeconds: [Number]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionPuckJS);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridActionPuckJS.getModelName());
    }

    static getModelName() {
        return 'GridActionPuckJS';
    }
}

GridActionPuckJS.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionPuckJS.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    timeoutSeconds: 0
});

export { GridActionPuckJS };

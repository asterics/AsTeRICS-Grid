import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionUART extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    data: [String],
    connectionType: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionUART);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridActionUART.getModelName());
    }

    static getModelName() {
        return 'GridActionUART';
    }
}

GridActionUART.CONN_TYPE_BT = "CONN_TYPE_BT";
GridActionUART.CONN_TYPE_SERIAL = "CONN_TYPE_SERIAL";
GridActionUART.CONN_TYPES = [GridActionUART.CONN_TYPE_BT, GridActionUART.CONN_TYPE_SERIAL];

GridActionUART.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionUART.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    connectionType: GridActionUART.CONN_TYPE_BT
});

export { GridActionUART };

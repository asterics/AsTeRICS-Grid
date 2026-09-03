import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionNavigate extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    navType: [String],
    toGridId: [String],
    addToCollectElem: [Boolean],
    searchCollectedText: [Boolean],
    searchText: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionNavigate);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-navigate');
    }

    static getModelName() {
        return 'GridActionNavigate';
    }
}

GridActionNavigate.NAV_TYPES = {
    TO_GRID: 'navigateToGrid',
    TO_HOME: 'navigateToHomeGrid',
    TO_LAST: 'navigateToLastOpenedGrid',
    OPEN_SEARCH: 'navigateToSearch'
}
GridActionNavigate.canBeTested = false;

GridActionNavigate.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionNavigate.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    navType: GridActionNavigate.NAV_TYPES.TO_GRID
});

export { GridActionNavigate };

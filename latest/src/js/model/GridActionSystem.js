import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionSystem extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    action: [String],
    actionValue: [String, Number, undefined]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionSystem);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridActionSystem.getModelName());
    }

    static getModelName() {
        return 'GridActionSystem';
    }
}

GridActionSystem.canBeTested = false;

GridActionSystem.actions = {
    SYS_VOLUME_UP: 'SYS_VOLUME_UP',
    SYS_VOLUME_DOWN: 'SYS_VOLUME_DOWN',
    SYS_VOLUME_TOGGLE_MUTE: 'SYS_VOLUME_TOGGLE_MUTE',
    SYS_ENTER_FULLSCREEN: 'SYS_ENTER_FULLSCREEN',
    SYS_LEAVE_FULLSCREEN: 'SYS_LEAVE_FULLSCREEN'
};

GridActionSystem.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionSystem.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    action: GridActionSystem.actions.SYS_VOLUME_UP,
    actionValue: 10
});

export { GridActionSystem };

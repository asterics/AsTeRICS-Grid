import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionMatrix extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    action: [String],
    sendText: [String],
    scrollPx: [Number],
    selectRoomId: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionMatrix);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridActionMatrix.getModelName());
    }

    static getModelName() {
        return 'GridActionMatrix';
    }

    static getActions() {
        return Object.keys(GridActionMatrix.actions);
    }
}

GridActionMatrix.canBeTested = false;

GridActionMatrix.actions = {
    MATRIX_SEND_COLLECTED: 'MATRIX_SEND_COLLECTED',
    MATRIX_SEND_COLLECTED_TEXT: 'MATRIX_SEND_COLLECTED_TEXT',
    MATRIX_SEND_CUSTOM: 'MATRIX_SEND_CUSTOM',
    MATRIX_NEXT_CONVERSATION: 'MATRIX_NEXT_CONVERSATION',
    MATRIX_PREV_CONVERSATION: 'MATRIX_PREV_CONVERSATION',
    MATRIX_SET_CONVERSATION: 'MATRIX_SET_CONVERSATION',
    MATRIX_SCROLL_UP: 'MATRIX_SCROLL_UP',
    MATRIX_SCROLL_DOWN: 'MATRIX_SCROLL_DOWN',
    MATRIX_SPEAK_LAST_MSG: 'MATRIX_SPEAK_LAST_MSG'
};

GridActionMatrix.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionMatrix.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export { GridActionMatrix };

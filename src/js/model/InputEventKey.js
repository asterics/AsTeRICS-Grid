import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class InputEventKey extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    label: [String],
    keyCode: [Number, String],
    keyName: [String],
    repeat: [Number],
    timeout: [Number],
    holdDuration: [Number]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputEventKey);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-event-key');
    }

    isValid() {
        return this.modelName && this.label && this.keyCode;
    }

    static getModelName() {
        return 'InputEventKey';
    }
}

InputEventKey.KEY_MOUSE_PREFIX = "KEY_MOUSE";
InputEventKey.KEY_MOUSE_LEFT = "KEY_MOUSE0";
InputEventKey.KEY_MOUSE_MIDDLE = "KEY_MOUSE1";
InputEventKey.KEY_MOUSE_RIGHT = "KEY_MOUSE2";
InputEventKey.KEY_TAP = "KEY_TAP";
InputEventKey.SPECIAL_KEYS = [
    InputEventKey.KEY_MOUSE_LEFT,
    InputEventKey.KEY_MOUSE_MIDDLE,
    InputEventKey.KEY_MOUSE_RIGHT,
    InputEventKey.KEY_TAP
];

InputEventKey.defaults({
    id: '', //will be replaced by constructor
    modelName: InputEventKey.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    repeat: 1,
    timeout: 0,
    holdDuration: 0
});

export { InputEventKey };

import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class InputEventKey extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    label: [String],
    keyCode: [Number],
    keyName: [String],
    repeat: [Number],
    timeout: [Number],
    holdDuration: [Number]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputEventKey);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-event-key')
    }

    isValid() {
        return this.modelName && this.label && this.keyCode;
    }

    static getModelName() {
        return "InputEventKey";
    }
}

InputEventKey.defaults({
    id: "", //will be replaced by constructor
    modelName: InputEventKey.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    repeat: 1,
    timeout: 0,
    holdDuration: 0
});

export {InputEventKey};
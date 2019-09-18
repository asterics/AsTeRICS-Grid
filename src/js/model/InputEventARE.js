import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class InputEventARE extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    label: [String],
    eventName: [String],
    areURL: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputEventARE);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-event-are')
    }

    isValid() {
        return this.modelName && this.label && this.eventName;
    }

    static getModelName() {
        return "InputEventARE";
    }
}

InputEventARE.defaults({
    id: "", //will be replaced by constructor
    modelName: InputEventARE.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {InputEventARE};
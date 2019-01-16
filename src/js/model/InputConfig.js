import {modelUtil} from "../util/modelUtil";
import Model from "objectmodel"
import {constants} from "../util/constants";

class InputConfig extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    scanAutostart: [Boolean],
    scanTimeoutMs: Number,
    scanTimeoutFirstElementFactor: Number, //factor for first element scanning time, e.g. scanTimeoutMs = 1000, scanTimeoutFirstElementFactor = 2 => scanning time for first element = 2000ms
    scanVertical: [Boolean],
    scanBinary: [Boolean],
    scanKey: [Number],
    scanKeyName: [String],
    areEvents: Model.Array(String),
    areURL: [String],
    hoverEnabled: [Boolean],
    hoverTimeoutMs: Number,
    mouseclickEnabled: [Boolean]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputConfig);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-config')
    }

    static getModelName() {
        return "InputConfig";
    }
}

InputConfig.defaults({
    id: "", //will be replaced by constructor
    modelName: InputConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    scanAutostart: true,
    scanTimeoutMs: 1000,
    scanTimeoutFirstElementFactor: 1,
    scanBinary: true,
    scanKey: 32, //space
    scanKeyName: "Space", //space
    areEvents: [],
    areURL: "",
    hoverTimeoutMs: 1000,
    mouseclickEnabled: true
});

export {InputConfig};
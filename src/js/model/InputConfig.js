import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";
import {InputEventKey} from "./InputEventKey";
import {InputEventARE} from "./InputEventARE";

class InputConfig extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    scanEnabled: [Boolean],
    scanAutostart: [Boolean], //TODO delete
    scanAuto: [Boolean],
    scanTimeoutMs: [Number],
    scanTimeoutFirstElementFactor: [Number], //factor for first element scanning time, e.g. scanTimeoutMs = 1000, scanTimeoutFirstElementFactor = 2 => scanning time for first element = 2000ms
    scanVertical: [Boolean],
    scanBinary: [Boolean],
    scanKey: [Number], //TODO: delete
    scanKeyName: [String], //TODO: delete
    scanInputs: [Model.Array(Object)], //object with keys InputConfig.NEXT/SELECT
    areEvents: Model.Array(String),
    areURL: [String], //TODO: delete
    hoverEnabled: [Boolean],
    hoverTimeoutMs: Number,
    mouseclickEnabled: [Boolean],
    dirEnabled: [Boolean],
    dirInputs: [Model.Array(Object)], //object with keys InputConfig.UP/DOWN/LEFT/RIGHT/SELECT
    dirWrapAround: [Boolean],
    huffEnabled: [Boolean],
    huffElementCount: [Number],
    huffInputs: [Model.Array(Object)], // ordered array of InputEvent objects
    huffColors: [Model.Array(String)]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputConfig);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-config')
    }

    static getModelName() {
        return "InputConfig";
    }

    static getInputEventTypes() {
        return [InputEventKey, InputEventARE];
    }

    static getInputEventInstance(modelName, options) {
        let constructor = this.getInputEventTypes().filter(type => type.getModelName() === modelName)[0];
        if (constructor) {
            return new constructor(options);
        } else {
            log.warn('input event type not found: ' + modelName);
        }
    }
}
InputConfig.UP = "UP";
InputConfig.DOWN = "DOWN";
InputConfig.LEFT = "LEFT";
InputConfig.RIGHT = "RIGHT";
InputConfig.SELECT = "SELECT";
InputConfig.NEXT = "NEXT";
InputConfig.getNumConst = (num) => "NUM" + num;

InputConfig.defaults({
    id: "", //will be replaced by constructor
    modelName: InputConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    scanAuto: false,
    scanTimeoutMs: 1000,
    scanTimeoutFirstElementFactor: 1,
    scanBinary: true,
    scanKey: 32, //space
    scanKeyName: "Space", //space
    areEvents: [],
    areURL: "",
    hoverTimeoutMs: 1000,
    mouseclickEnabled: true,
    scanInputs: [
        new InputEventKey({label: InputConfig.SELECT, keyCode: 32, keyName: "Space", holdDuration: 400}),
        new InputEventKey({label: InputConfig.NEXT, keyCode: 32, keyName: "Space"})
    ],
    dirInputs: [
        new InputEventKey({label: InputConfig.SELECT, keyCode: 32, keyName: "Space"}),
        new InputEventKey({label: InputConfig.LEFT, keyCode: 37, keyName: "ArrowLeft"}),
        new InputEventKey({label: InputConfig.RIGHT, keyCode: 39, keyName: "ArrowRight"}),
        new InputEventKey({label: InputConfig.UP, keyCode: 38, keyName: "ArrowUp"}),
        new InputEventKey({label: InputConfig.DOWN, keyCode: 40, keyName: "ArrowDown"}),
    ],
    huffInputs: []
});

export {InputConfig};
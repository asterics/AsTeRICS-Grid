import {modelUtil} from "../util/modelUtil";
import Model from "objectmodel"

class InputConfig extends Model({
    id: String,
    autostart: [Boolean],
    scanTimeoutMs: Number,
    scanTimeoutFirstElementFactor: Number, //factor for first element scanning time, e.g. scanTimeoutMs = 1000, scanTimeoutFirstElementFactor = 2 => scanning time for first element = 2000ms
    scanVertical: [Boolean],
    binaryScanning: Boolean
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputConfig);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-config')
    }
}

InputConfig.defaults({
    id: "", //will be replaced by constructor
    scanTimeoutMs: 1000,
    scanTimeoutFirstElementFactor: 1.5,
    binaryScanning: true
});

export {InputConfig};
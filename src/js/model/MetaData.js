import {modelUtil} from "../util/modelUtil";
import {InputConfig} from "./InputConfig";

class MetaData extends Model({
    id: String,
    modelName: String,
    lastOpenedGridId: [String],
    headerPinned: [Boolean],
    imageHashCodes: [Object], //object keys: image hashcodes, object values: image ids
    inputConfig: InputConfig
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, MetaData);
        super(properties);
        this.id = this.id || modelUtil.generateId('meta-data')
    }

    static getModelName() {
        return "MetaData";
    }
}

MetaData.defaults({
    id: "", //will be replaced by constructor
    headerPinned: true,
    modelName: MetaData.getModelName(),
    imageHashCodes: {},
    inputConfig: new InputConfig()
});

export {MetaData};
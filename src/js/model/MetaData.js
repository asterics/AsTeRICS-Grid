import {modelUtil} from "../util/modelUtil";

class MetaData extends Model({
    id: String,
    modelName: String,
    lastOpenedGridId: [String],
    imageHashCodes: [Object] //object keys: image hashcodes, object values: image ids
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
    modelName: MetaData.getModelName(),
    imageHashCodes: {}
});

export {MetaData};
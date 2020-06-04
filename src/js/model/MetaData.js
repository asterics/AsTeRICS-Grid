import {modelUtil} from "../util/modelUtil";
import {InputConfig} from "./InputConfig";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class MetaData extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    lastOpenedGridId: [String],
    globalGridId: [String],
    globalGridActive: [Boolean],
    globalGridHeightPercentage: [Number],
    locked: [Boolean],
    fullscreen: [Boolean],
    hashCodes: [Object], //object keys: model names of hashed objects, object values: another object with keys = hashcodes, values = object ids
    inputConfig: InputConfig
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, MetaData) || {};
        super(properties);
        this.id = this.id || modelUtil.generateId(MetaData.getIdPrefix())
    }

    isEqual(otherMetadata) {
        var comp1 = JSON.parse(JSON.stringify(otherMetadata));
        var comp2 = JSON.parse(JSON.stringify(this));
        delete comp1._rev;
        delete comp2._rev;
        delete comp1._id;
        delete comp2._id;
        return JSON.stringify(comp1) == JSON.stringify(comp2);
    }

    static getModelName() {
        return "MetaData";
    }

    static getIdPrefix() {
        return 'meta-data';
    }
}

MetaData.defaults({
    id: "", //will be replaced by constructor
    modelName: MetaData.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    locked: undefined,
    fullscreen: undefined,
    hashCodes: {},
    inputConfig: new InputConfig(),
    globalGridActive: false,
    globalGridHeightPercentage: 15
});

export {MetaData};
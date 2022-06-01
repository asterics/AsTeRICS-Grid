import {modelUtil} from "../util/modelUtil";
import {InputConfig} from "./InputConfig";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";
import {ColorConfig} from "./ColorConfig.js";

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
    inputConfig: InputConfig,
    colorConfig: [ColorConfig]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, MetaData) || {};
        super(properties);
        this.id = this.id || modelUtil.generateId(MetaData.getIdPrefix());
        this.colorConfig = properties.colorConfig || new ColorConfig();
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

    static getActiveColorScheme(metadata) {
        metadata = metadata || new MetaData();
        return constants.DEFAULT_COLOR_SCHEMES.filter(scheme => scheme.name === metadata.colorConfig.activeColorScheme)[0] || constants.DEFAULT_COLOR_SCHEMES[0];
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
    globalGridHeightPercentage: 20
});

export {MetaData};
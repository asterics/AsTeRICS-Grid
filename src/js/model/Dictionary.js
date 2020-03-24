import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class Dictionary extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    dictionaryKey: String,
    data: [String], //JSON data
    isDefault: [Boolean]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, Dictionary);
        super(properties);
        this.id = this.id || modelUtil.generateId(Dictionary.getIdPrefix());
    }

    clone() {
        let newDict = new Dictionary(this);
        delete newDict._id;
        delete newDict._rev;
        newDict.id = modelUtil.generateId('dictionary');
        newDict.dictionaryKey = this.dictionaryKey + ' (Copy)';
        return newDict;
    }

    static getModelName() {
        return "Dictionary";
    }

    static getIdPrefix() {
        return 'dictionary';
    }
}

Dictionary.defaults({
    id: "", //will be replaced by constructor
    modelName: Dictionary.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    data: JSON.stringify({})
});

export {Dictionary};
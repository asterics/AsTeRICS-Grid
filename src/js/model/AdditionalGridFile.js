import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class AdditionalGridFile extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    fileName: [String],
    dataBase64: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, AdditionalGridFile);
        super(properties);
        this.id = this.id || modelUtil.generateId(AdditionalGridFile.getModelName().toLowerCase());
    }

    static getModelName() {
        return "AdditionalGridFile";
    }
}

AdditionalGridFile.defaults({
    id: "", //will be replaced by constructor
    modelName: AdditionalGridFile.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {AdditionalGridFile};
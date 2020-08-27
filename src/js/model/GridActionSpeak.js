import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";
import {i18nService} from "../service/i18nService";

class GridActionSpeak extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    speakLanguage: [String, null, undefined]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionSpeak);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-speak')
    }

    static getModelName() {
        return "GridActionSpeak";
    }
}

GridActionSpeak.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionSpeak.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {GridActionSpeak};
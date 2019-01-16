import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";

class GridActionSpeak extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    speakLanguage: String
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
    speakLanguage: navigator.language.substring(0,2),
    modelVersion: constants.MODEL_VERSION
});

export {GridActionSpeak};
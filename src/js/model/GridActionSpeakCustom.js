import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";

class GridActionSpeakCustom extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    speakLanguage: String,
    speakText: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionSpeakCustom);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-speak-custom')
    }

    static getModelName() {
        return "GridActionSpeakCustom";
    }
}

GridActionSpeakCustom.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionSpeakCustom.getModelName(),
    speakLanguage: navigator.language.substring(0,2),
    modelVersion: constants.MODEL_VERSION
});

export {GridActionSpeakCustom};
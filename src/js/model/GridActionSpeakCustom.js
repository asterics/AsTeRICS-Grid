import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";
import {i18nService} from "../service/i18nService";

class GridActionSpeakCustom extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    speakLanguage: [String, null, undefined],
    speakText: [Object, String], //map locale -> translation, e.g. "de" => LabelDE
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
    modelVersion: constants.MODEL_VERSION,
    speakText: {}
});

export {GridActionSpeakCustom};
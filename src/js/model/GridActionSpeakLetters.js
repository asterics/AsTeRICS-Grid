import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';
import { i18nService } from '../service/i18nService';

class GridActionSpeakLetters extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    speakLanguage: [String, null, undefined],
    speakText: [Object, String], //map locale -> translation, e.g. "de" => LabelDE
    pauseDurationMs: [Number] // pause duration between letters in milliseconds
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionSpeakLetters);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-speak-letters');
    }

    static getModelName() {
        return 'GridActionSpeakLetters';
    }
}

GridActionSpeakLetters.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionSpeakLetters.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    pauseDurationMs: 200 // default 200ms pause between letters
});

export { GridActionSpeakLetters };

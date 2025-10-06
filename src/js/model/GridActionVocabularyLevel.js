import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionVocabularyLevel extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    action: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionVocabularyLevel);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridActionVocabularyLevel.getModelName());
    }

    static getModelName() {
        return 'GridActionVocabularyLevel';
    }
}

GridActionVocabularyLevel.canBeTested = false;

GridActionVocabularyLevel.actions = {
    VOCAB_TOGGLE: 'VOCAB_TOGGLE'
};

GridActionVocabularyLevel.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionVocabularyLevel.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    action: GridActionVocabularyLevel.actions.VOCAB_TOGGLE
});

export { GridActionVocabularyLevel };

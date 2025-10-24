import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionVocabLevelToggle extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    mode: [String]
}) {
    constructor(properties, elementToCopy){
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionVocabLevelToggle);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-vocab-level-toggle');
    }

    static getModelName(){
        return 'GridActionVocabLevelToggle';
    }

    static getModes() {
        return Object.keys(GridActionVocabLevelToggle.modes);
    }
}

GridActionVocabLevelToggle.canBeTested = false;

GridActionVocabLevelToggle.modes = {
    TOGGLE_TO_FULL: 'TOGGLE_TO_FULL'
};

GridActionVocabLevelToggle.defaults({
    id: '',     //will be replaced by constructor
    modelName: GridActionVocabLevelToggle.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    mode: GridActionVocabLevelToggle.modes.TOGGLE_TO_FULL
});

export { GridActionVocabLevelToggle };

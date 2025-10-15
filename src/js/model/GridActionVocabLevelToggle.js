import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionVocabLevelToggle extends Model({
    id: String,
    modelName: String,
    modelVersion: String
}) {
    constructor(properties, elementToCopy){
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionVocabLevelToggle);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-vocab-level-toggle');
    }

    static getModelName(){
        return 'GridActionVocabLevelToggle';
    }
}

GridActionVocabLevelToggle.defaults({
    id: '',     //will be replaced by constructor
    modelName: GridActionVocabLevelToggle.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export { GridActionVocabLevelToggle };

import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionWordForm extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    tags: [Model.Array(String)]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionWordForm);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-word-form');
    }

    static getModelName() {
        return 'GridActionWordForm';
    }
}

GridActionWordForm.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionWordForm.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    tags: []
});

export { GridActionWordForm };

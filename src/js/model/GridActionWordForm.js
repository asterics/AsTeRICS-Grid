import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionWordForm extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    type: [String],
    tags: [Model.Array(String)],
    toggle: [Boolean]
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

GridActionWordForm.WORDFORM_MODE_CHANGE_ELEMENTS = "WORDFORM_MODE_CHANGE_ELEMENTS";
GridActionWordForm.WORDFORM_MODE_CHANGE_BAR = "WORDFORM_MODE_CHANGE_BAR";
GridActionWordForm.WORDFORM_MODE_CHANGE_EVERYWHERE = "WORDFORM_MODE_CHANGE_EVERYWHERE";
GridActionWordForm.WORDFORM_MODE_NEXT_FORM = 'WORDFORM_MODE_NEXT_FORM';
GridActionWordForm.WORDFORM_MODE_RESET_FORMS = 'WORDFORM_MODE_RESET_FORMS';

GridActionWordForm.MODES = [
    GridActionWordForm.WORDFORM_MODE_CHANGE_ELEMENTS,
    GridActionWordForm.WORDFORM_MODE_CHANGE_BAR,
    GridActionWordForm.WORDFORM_MODE_CHANGE_EVERYWHERE,
    GridActionWordForm.WORDFORM_MODE_NEXT_FORM,
    GridActionWordForm.WORDFORM_MODE_RESET_FORMS
];

GridActionWordForm.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionWordForm.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    type: GridActionWordForm.WORDFORM_MODE_CHANGE_ELEMENTS,
    tags: []
});

export { GridActionWordForm };

import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionAudio extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    dataBase64: [String],
    mimeType: [String],
    durationMs: [Number]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionAudio);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-audio');
    }

    static getModelName() {
        return 'GridActionAudio';
    }
}

GridActionAudio.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionAudio.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export { GridActionAudio };

import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridImage extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    data: [String],
    author: [String],
    authorURL: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridImage);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridImage.getIdPrefix())
    }

    static getModelName() {
        return "GridImage";
    }

    static getIdPrefix() {
        return 'grid-image';
    }
}

GridImage.defaults({
    id: "", //will be replaced by constructor
    modelName: GridImage.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    data: null,
    author: null,
    authorURL: null
});

export {GridImage};
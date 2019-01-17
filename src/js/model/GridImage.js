import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridImage extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    data: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridImage);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-image')
    }

    static getModelName() {
        return "GridImage";
    }
}

GridImage.defaults({
    id: "", //will be replaced by constructor
    modelName: GridImage.getModelName(),
    modelVersion: constants.MODEL_VERSION,
});

export {GridImage};
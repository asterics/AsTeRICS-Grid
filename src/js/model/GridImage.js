import {modelUtil} from "../util/modelUtil";

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
    modelVersion: modelUtil.getModelVersionString(),
});

export {GridImage};
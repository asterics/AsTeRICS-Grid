import {modelUtil} from "../util/modelUtil";
import {Model} from "../externals/objectmodel";

class GridActionChangeLang extends Model({
    id: String,
    modelName: String,
    language: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionChangeLang);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-change-lang')
    }

    static getModelName() {
        return "GridActionChangeLang";
    }
}

GridActionChangeLang.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionChangeLang.getModelName(),
});

export {GridActionChangeLang};
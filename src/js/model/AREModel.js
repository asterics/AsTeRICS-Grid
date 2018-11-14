import {modelUtil} from "../util/modelUtil";

class AREModel extends Model({
    id: String,
    modelName: String,
    modelDataBase64: [String],
    areModelName: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, AREModel);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-navigate')
    }

    static getModelName() {
        return "AREModel";
    }
}

AREModel.defaults({
    id: "", //will be replaced by constructor
    modelName: AREModel.getModelName(),
    modelDataBase64: null,
    areModelName: null
});

export {AREModel};
import {modelUtil} from "../util/modelUtil";

class MetaData extends Model({
    id: String,
    modelName: String,
    lastOpenedGridId: String
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, MetaData);
        super(properties);
        this.id = this.id || modelUtil.generateId('meta-data')
    }

    static getModelName() {
        return this.name;
    }
}

MetaData.defaults({
    id: "", //will be replaced by constructor
    modelName: MetaData.getModelName()
});

export {MetaData};
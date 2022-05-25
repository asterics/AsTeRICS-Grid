import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionKeyValueRequest extends Model({
    id: String,
    modelName: String,
    modelVersion: String,

    keyParameter: [String],
    valueParameter: [String],
    urlRequest: [String],
    format: [String],
    bodyData: [String],
    // body: [String],
    //   params: [String],
    method: [String]

}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionKeyValueRequest);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-key-value-request')
        // this.id = this.id || modelUtil.generateId(GridActionOpenWebpage.getModelName())  /
    }

    static getModelName() {
        return "GridActionKeyValueRequest";
    }
}

GridActionKeyValueRequest.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionKeyValueRequest.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {GridActionKeyValueRequest};
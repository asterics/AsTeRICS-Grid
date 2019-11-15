import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class Webradio extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    radioId: [String], //id from https://www.radio-browser.info/
    radioUUID: [String],
    radioName: [String],
    radioUrl: [String],
    faviconUrl: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, Webradio);
        super(properties);
        this.id = this.id || modelUtil.generateId('webradio')
    }

    static getModelName() {
        return "Webradio";
    }
}

Webradio.defaults({
    id: "", //will be replaced by constructor
    modelName: Webradio.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {Webradio};
import {Model} from "../externals/objectmodel";
import {constants} from "../util/constants";

class TextConfig extends Model({
    modelName: String,
    modelVersion: String,
    convertMode: [String]
}) {
    constructor(properties) {
        super(properties);
    }

    static getModelName() {
        return "TextConfig";
    }
}

TextConfig.CONVERT_MODE_UPPERCASE = 'CONVERT_MODE_UPPERCASE';
TextConfig.CONVERT_MODE_LOWERCASE = 'CONVERT_MODE_LOWERCASE';

TextConfig.defaults({
    modelName: TextConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    convertMode: null
});

export {TextConfig};
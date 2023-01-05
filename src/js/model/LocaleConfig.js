import {Model} from "../externals/objectmodel";
import {constants} from "../util/constants";

class LocaleConfig extends Model({
    modelName: String,
    modelVersion: String,
    contentLang: [String],
    preferredVoice: [String],
    secondVoice: [String],
    voiceLangIsTextLang: [Boolean],
    voicePitch: [Number],
    voiceRate: [Number]
}) {
    constructor(properties) {
        super(properties);
    }

    static getModelName() {
        return "LocaleConfig";
    }
}

LocaleConfig.defaults({
    modelName: LocaleConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {LocaleConfig};
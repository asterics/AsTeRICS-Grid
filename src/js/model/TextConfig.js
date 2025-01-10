import { Model } from '../externals/objectmodel';
import { constants } from '../util/constants';

class TextConfig extends Model({
    modelName: String,
    modelVersion: String,
    convertMode: [String],
    fontFamily: [String],
    fontSizePct: [Number],
    lineHeight: [Number],
    maxLines: [Number],
    textPosition: [String],
    onlyTextFontSizePct: [Number],
    onlyTextLineHeight: [Number]
}) {
    constructor(properties) {
        super(properties);
    }

    static getModelName() {
        return 'TextConfig';
    }
}

TextConfig.CONVERT_MODE_UPPERCASE = 'CONVERT_MODE_UPPERCASE';
TextConfig.CONVERT_MODE_LOWERCASE = 'CONVERT_MODE_LOWERCASE';

TextConfig.TEXT_POS_ABOVE = 'ABOVE';
TextConfig.TEXT_POS_BELOW = 'BELOW';

TextConfig.FONTS = ["Arial", "Roboto-Regular", "OpenDyslexic-Regular", "Jost-500-Medium", "Times"]

TextConfig.defaults({
    modelName: TextConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    convertMode: null,
    fontFamily: "Arial",
    fontSizePct: 12,
    lineHeight: 1.5,
    maxLines: 2,
    textPosition: TextConfig.TEXT_POS_BELOW,
    onlyTextFontSizePct: 12,
    onlyTextLineHeight: 1
});

export { TextConfig };

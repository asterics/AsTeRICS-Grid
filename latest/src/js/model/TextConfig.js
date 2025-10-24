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
    onlyTextLineHeight: [Number],
    fittingMode: [String],
    autoSizeKeyboardLetters: [Boolean],
    fontColor: [String]
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

TextConfig.TOO_LONG_AUTO= 'AUTO';
TextConfig.TOO_LONG_TRUNCATE = 'TRUNCATE';
TextConfig.TOO_LONG_ELLIPSIS = 'ELLIPSIS';

TextConfig.FONTS = ["Arial", "Roboto-Regular", "OpenDyslexic-Regular", "Jost-400-Book", "Times"]

TextConfig.defaults({
    modelName: TextConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    convertMode: null,
    fontFamily: "Arial",
    fontSizePct: 15,
    lineHeight: 1.5,
    maxLines: 1,
    textPosition: TextConfig.TEXT_POS_BELOW,
    onlyTextFontSizePct: 35,
    onlyTextLineHeight: 1.5,
    fittingMode: TextConfig.TOO_LONG_AUTO,
    autoSizeKeyboardLetters: true,
    fontColor: constants.DEFAULT_ELEMENT_FONT_COLOR
});

export { TextConfig };

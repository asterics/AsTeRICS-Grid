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

TextConfig.FONT_ARIAL = "Arial";
TextConfig.FONT_JOST_400_BOOK = "Jost-400-Book";
TextConfig.FONT_OPEN_DYSLEXIC_REGULAR = "OpenDyslexic-Regular";
TextConfig.FONT_PRIMA_BOLD = "Prima-Bold";
TextConfig.FONT_PRIMA_BOLD_CURSIVE = "Prima-BoldCursive";
TextConfig.FONT_ROBOTO_REGULAR = "Roboto-Regular";
TextConfig.FONT_TIMES = "Times";

TextConfig.FONTS = [TextConfig.FONT_ARIAL, TextConfig.FONT_JOST_400_BOOK, TextConfig.FONT_OPEN_DYSLEXIC_REGULAR, TextConfig.FONT_PRIMA_BOLD, TextConfig.FONT_PRIMA_BOLD_CURSIVE, TextConfig.FONT_ROBOTO_REGULAR, TextConfig.FONT_TIMES];
TextConfig.FONT_TO_FILENAME = {};
TextConfig.FONT_TO_FILENAME[TextConfig.FONT_ARIAL] = "Arimo-Regular";
TextConfig.FONT_TO_FILENAME[TextConfig.FONT_JOST_400_BOOK] = "Jost-400-Book";
TextConfig.FONT_TO_FILENAME[TextConfig.FONT_OPEN_DYSLEXIC_REGULAR] = "OpenDyslexic-Regular";
TextConfig.FONT_TO_FILENAME[TextConfig.FONT_PRIMA_BOLD] = "Primae-Bold";
TextConfig.FONT_TO_FILENAME[TextConfig.FONT_PRIMA_BOLD_CURSIVE] = "Primae-BoldCursive";
TextConfig.FONT_TO_FILENAME[TextConfig.FONT_ROBOTO_REGULAR] = "Roboto-Regular";
TextConfig.FONT_TO_FILENAME[TextConfig.FONT_TIMES] = "Tinos-Regular";

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

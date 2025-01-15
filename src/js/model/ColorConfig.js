import { Model } from '../externals/objectmodel';
import { constants } from '../util/constants';

class ColorConfig extends Model({
    modelName: String,
    modelVersion: String,
    colorSchemesActivated: [Boolean],
    activeColorScheme: [String],
    additionalColorSchemes: [Array],
    elementBackgroundColor: [String],
    elementBorderColor: [String],
    gridBackgroundColor: [String],
    borderWidth: [Number],
    elementMargin: [Number],
    borderRadius: [Number],
    colorMode: [String]
}) {
    constructor(properties) {
        super(properties);
    }

    static getModelName() {
        return 'ColorConfig';
    }
}

ColorConfig.COLOR_MODE_BACKGROUND = 'COLOR_MODE_BACKGROUND';
ColorConfig.COLOR_MODE_BORDER = 'COLOR_MODE_BORDER';

ColorConfig.BORDER_WIDTH_BORDER_COLORED = 5;
ColorConfig.BORDER_WIDTH_BG_COLORED = 1;

ColorConfig.defaults({
    modelName: ColorConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    colorSchemesActivated: true,
    activeColorScheme: constants.DEFAULT_COLOR_SCHEMES[0].name,
    additionalColorSchemes: [],
    elementBackgroundColor: constants.DEFAULT_ELEMENT_BACKGROUND_COLOR,
    elementBorderColor: constants.DEFAULT_ELEMENT_BORDER_COLOR,
    gridBackgroundColor: constants.DEFAULT_GRID_BACKGROUND_COLOR,
    borderWidth: ColorConfig.BORDER_WIDTH_BG_COLORED,
    elementMargin: 2,
    borderRadius: 3,
    colorMode: ColorConfig.COLOR_MODE_BACKGROUND
});

export { ColorConfig };

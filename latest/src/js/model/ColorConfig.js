import { Model } from '../externals/objectmodel';
import { constants } from '../util/constants';

class ColorConfig extends Model({
    modelName: String,
    modelVersion: String,
    colorSchemesActivated: [Boolean],
    activeColorScheme: [String],
    additionalColorSchemes: [Array],
    elementBackgroundColor: [String],
    gridBackgroundColor: [String]
}) {
    constructor(properties) {
        super(properties);
    }

    static getModelName() {
        return 'ColorConfig';
    }
}

ColorConfig.defaults({
    modelName: ColorConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    colorSchemesActivated: true,
    activeColorScheme: constants.DEFAULT_COLOR_SCHEMES[0].name,
    additionalColorSchemes: [],
    elementBackgroundColor: constants.DEFAULT_ELEMENT_BACKGROUND_COLOR,
    gridBackgroundColor: constants.DEFAULT_GRID_BACKGROUND_COLOR
});

export { ColorConfig };

import { modelUtil } from '../util/modelUtil';
import { InputConfig } from './InputConfig';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';
import { ColorConfig } from './ColorConfig.js';
import { TextConfig } from './TextConfig.js';
import { NotificationConfig } from './NotificationConfig.js';
import { IntegrationConfigSync } from './IntegrationConfigSync.js';

class MetaData extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    homeGridId: [String],
    toHomeAfterSelect: [Boolean],
    lastOpenedGridId: [String],
    globalGridId: [String],
    globalGridActive: [Boolean],
    globalGridHeightPercentage: [Number],
    locked: [Boolean],
    fullscreen: [Boolean],
    hashCodes: [Object], //object keys: model names of hashed objects, object values: another object with keys = hashcodes, values = object ids
    inputConfig: InputConfig,
    colorConfig: [ColorConfig],
    textConfig: [TextConfig],
    notificationConfig: [NotificationConfig],
    activateARASAACGrammarAPI: [Boolean],
    vocabularyLevel: [Number, null],
    integrations: [Object] // IntegrationConfigSync
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, MetaData) || {};
        super(properties);
        this.id = this.id || modelUtil.generateId(MetaData.getIdPrefix());
        this.colorConfig = properties.colorConfig || new ColorConfig();
        this.textConfig = properties.textConfig || new TextConfig();
        this.notificationConfig = properties.notificationConfig || new NotificationConfig();
        this.homeGridId = properties.homeGridId || null;
        this.integrations = Object.assign(new IntegrationConfigSync(), this.integrations);
    }

    isEqual(otherMetadata) {
        var comp1 = JSON.parse(JSON.stringify(otherMetadata));
        var comp2 = JSON.parse(JSON.stringify(this));
        delete comp1._rev;
        delete comp2._rev;
        delete comp1._id;
        delete comp2._id;
        return JSON.stringify(comp1) == JSON.stringify(comp2);
    }

    static getUseColorScheme(metadata) {
        if (!metadata || !metadata.colorConfig || !metadata.colorConfig.colorSchemesActivated) {
            return null;
        }
        return MetaData.getActiveColorScheme(metadata);
    }

    static getActiveColorScheme(metadata) {
        metadata = metadata || new MetaData();
        return (
            constants.DEFAULT_COLOR_SCHEMES.filter(
                (scheme) => scheme.name === metadata.colorConfig.activeColorScheme
            )[0] || constants.DEFAULT_COLOR_SCHEMES[0]
        );
    }

    static getElementColor(gridElement = {}, metadata, fallbackColor) {
        metadata = metadata || new MetaData();
        let defaultColor = gridElement.backgroundColor || fallbackColor || metadata.colorConfig.elementBackgroundColor || constants.DEFAULT_ELEMENT_BACKGROUND_COLOR;
        let colorScheme = MetaData.getUseColorScheme(metadata);
        if (!colorScheme) {
            return defaultColor;
        }
        let index = colorScheme.categories.indexOf(gridElement.colorCategory);
        if (index === -1 && colorScheme.mappings) {
            let mapped = colorScheme.mappings[gridElement.colorCategory];
            index = colorScheme.categories.indexOf(mapped);
        }
        return index === -1 ? defaultColor : colorScheme.colors[index];
    }

    static getModelName() {
        return 'MetaData';
    }

    static getIdPrefix() {
        return 'meta-data';
    }
}

MetaData.defaults({
    id: '', //will be replaced by constructor
    modelName: MetaData.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    locked: undefined,
    fullscreen: undefined,
    hashCodes: {},
    inputConfig: new InputConfig(),
    globalGridActive: false,
    globalGridHeightPercentage: 17,
    vocabularyLevel: null,
    integrations: new IntegrationConfigSync()
});

export { MetaData };

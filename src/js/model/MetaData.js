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
    globalGridHeightPercentage: [Number], // deprecated, was used before introducing dynamic grid placeholder
    firstRowHeightFactor: [Number],
    locked: [Boolean],
    fullscreen: [Boolean],
    hashCodes: [Object], //object keys: model names of hashed objects, object values: another object with keys = hashcodes, values = object ids
    inputConfig: InputConfig,
    colorConfig: [ColorConfig],
    textConfig: [TextConfig],
    notificationConfig: [NotificationConfig],
    activateARASAACGrammarAPI: [Boolean],
    vocabularyLevel: [Number, null],
    dontResetWordFormsAutomatically: [Boolean],
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
        this.firstRowHeightFactor = properties.firstRowHeightFactor || 1;
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
    firstRowHeightFactor: 1,
    vocabularyLevel: null,
    integrations: new IntegrationConfigSync()
});

export { MetaData };

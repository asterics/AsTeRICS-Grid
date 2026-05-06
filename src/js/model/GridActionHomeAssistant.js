import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionHomeAssistant extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    homeAssistantUrl: [String],
    itemType: [String], //Light, Switch, ... itemType
    itemName: [String], //itemName
    actionType: [String], //ON, OFF, CUSTOM_VALUE ... actionType
    actionValue: [String] //HSL, 0-100, ... (optional)
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionHomeAssistant);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-HomeAssistant');
    }

    static getModelName() {
        return 'GridActionHomeAssistant';
    }
}

GridActionHomeAssistant.defaults({
    id: '', //will be replaced by constructor
    modelName: GridActionHomeAssistant.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    actionValue: '0',
    itemType: '', //Light, Switch, ... itemType
    itemName: '', //itemName
    actionType: '', //ON, OFF, CUSTOM_VALUE ... actionType,
    homeAssistantUrl: '',
    token: ''
});

export { GridActionHomeAssistant };

import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionWebradio extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    action: [String],
    radioId: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionWebradio);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-webradio')
    }

    static getModelName() {
        return "GridActionWebradio";
    }

    static getActions() {
        return [GridActionWebradio.WEBRADIO_ACTION_START, GridActionWebradio.WEBRADIO_ACTION_TOGGLE, GridActionWebradio.WEBRADIO_ACTION_STOP,
            GridActionWebradio.WEBRADIO_ACTION_NEXT, GridActionWebradio.WEBRADIO_ACTION_PREV, GridActionWebradio.WEBRADIO_ACTION_VOLUP, GridActionWebradio.WEBRADIO_ACTION_VOLDOWN];
    }
}

GridActionWebradio.WEBRADIO_ACTION_START = 'WEBRADIO_ACTION_START';
GridActionWebradio.WEBRADIO_ACTION_TOGGLE = 'WEBRADIO_ACTION_TOGGLE';
GridActionWebradio.WEBRADIO_ACTION_STOP = 'WEBRADIO_ACTION_STOP';
GridActionWebradio.WEBRADIO_ACTION_NEXT = 'WEBRADIO_ACTION_NEXT';
GridActionWebradio.WEBRADIO_ACTION_PREV = 'WEBRADIO_ACTION_PREV';
GridActionWebradio.WEBRADIO_ACTION_VOLUP = 'WEBRADIO_ACTION_VOLUP';
GridActionWebradio.WEBRADIO_ACTION_VOLDOWN = 'WEBRADIO_ACTION_VOLDOWN';

GridActionWebradio.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionWebradio.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    radioId: "",
    action: GridActionWebradio.WEBRADIO_ACTION_START
});

export {GridActionWebradio};
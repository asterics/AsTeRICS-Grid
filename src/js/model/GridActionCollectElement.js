import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionCollectElement extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    action: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionCollectElement);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-action-collect-elm')
    }

    static getModelName() {
        return "GridActionCollectElement";
    }

    static getActions() {
        return [GridActionCollectElement.COLLECT_ACTION_CLEAR, GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD,
            GridActionCollectElement.COLLECT_ACTION_REMOVE_CHAR, GridActionCollectElement.COLLECT_ACTION_COPY_CLIPBOARD,
            GridActionCollectElement.COLLECT_ACTION_APPEND_CLIPBOARD, GridActionCollectElement.COLLECT_ACTION_CLEAR_CLIPBOARD, GridActionCollectElement.COLLECT_ACTION_TO_YOUTUBE];
    }
}

GridActionCollectElement.COLLECT_ACTION_CLEAR = 'COLLECT_ACTION_CLEAR';
GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD = 'COLLECT_ACTION_REMOVE_WORD';
GridActionCollectElement.COLLECT_ACTION_REMOVE_CHAR = 'COLLECT_ACTION_REMOVE_CHAR';
GridActionCollectElement.COLLECT_ACTION_COPY_CLIPBOARD = 'COLLECT_ACTION_COPY_CLIPBOARD';
GridActionCollectElement.COLLECT_ACTION_APPEND_CLIPBOARD = 'COLLECT_ACTION_APPEND_CLIPBOARD';
GridActionCollectElement.COLLECT_ACTION_CLEAR_CLIPBOARD = 'COLLECT_ACTION_CLEAR_CLIPBOARD';
GridActionCollectElement.COLLECT_ACTION_TO_YOUTUBE = 'COLLECT_ACTION_TO_YOUTUBE';

GridActionCollectElement.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionCollectElement.getModelName(),
    modelVersion: constants.MODEL_VERSION
});

export {GridActionCollectElement};
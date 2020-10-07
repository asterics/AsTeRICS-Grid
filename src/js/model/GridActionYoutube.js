import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class GridActionYoutube extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    action: [String],
    playType: [String],
    data: [String], // video link / playlist link / search query / channel link -> depending on "playType"
    stepSeconds: [Number]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionYoutube);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridActionYoutube.getModelName());
    }

    static getModelName() {
        return "GridActionYoutube";
    }

    static getActions() {
        return Object.keys(GridActionYoutube.actions);
    }

    static getPlayTypes() {
        return Object.keys(GridActionYoutube.playTypes);
    }
}

GridActionYoutube.actions = {
    YT_PLAY: 'YT_PLAY',
    YT_PAUSE: 'YT_PAUSE',
    YT_TOGGLE: 'YT_TOGGLE',
    YT_RESTART: 'YT_RESTART',
    YT_STOP: 'YT_STOP',
    YT_STEP_FORWARD: 'YT_STEP_FORWARD',
    YT_STEP_BACKWARD: 'YT_STEP_BACKWARD',
    YT_NEXT_VIDEO: 'YT_NEXT_VIDEO',
    YT_PREV_VIDEO: 'YT_PREV_VIDEO',
    YT_ENTER_FULLSCREEN: 'YT_ENTER_FULLSCREEN'
}

GridActionYoutube.playTypes = {
    YT_PLAY_VIDEO: 'YT_PLAY_VIDEO',
    YT_PLAY_PLAYLIST: 'YT_PLAY_PLAYLIST',
    YT_PLAY_SEARCH: 'YT_PLAY_SEARCH',
    YT_PLAY_CHANNEL: 'YT_PLAY_CHANNEL',
}

GridActionYoutube.defaults({
    id: "", //will be replaced by constructor
    modelName: GridActionYoutube.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    stepSeconds: 10,
    playType: GridActionYoutube.playTypes.YT_PLAY_VIDEO
});

export {GridActionYoutube};
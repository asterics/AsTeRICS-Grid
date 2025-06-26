import { modelUtil } from '../util/modelUtil';
import { Model } from '../externals/objectmodel';
import { constants } from '../util/constants';

class GridActionPodcast extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    action: [String],
    podcastGuid: [String],
    step: [Number]
}) {
    constructor(properties, elementToCopy) {
        let defaults = JSON.parse(JSON.stringify(GridActionPodcast.DEFAULTS));
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionPodcast) || {};
        super(Object.assign(defaults, properties));
        this.id = this.id || modelUtil.generateId(GridActionPodcast.ID_PREFIX);
    }

    static getModelName() {
        return 'GridActionPodcast';
    }
}

GridActionPodcast.actions = {
    PLAY: 'PLAY',
    PAUSE: 'PAUSE',
    TOGGLE: 'TOGGLE',
    STEP_FORWARD: 'STEP_FORWARD',
    STEP_BACKWARD: 'STEP_BACKWARD',
    LATEST_EPISODE: 'LATEST_EPISODE',
    NEXT_EPISODE: 'NEXT_EPISODE',
    PREV_EPISODE: 'PREV_EPISODE',
    VOLUME_UP: 'VOLUME_UP',
    VOLUME_DOWN: 'VOLUME_DOWN'
};

GridActionPodcast.actionsWithPodcastSelect = [
    GridActionPodcast.actions.PLAY, GridActionPodcast.actions.PAUSE, GridActionPodcast.actions.TOGGLE, GridActionPodcast.actions.LATEST_EPISODE
]

GridActionPodcast.actionsWithStepSeconds = [
    GridActionPodcast.actions.STEP_FORWARD, GridActionPodcast.actions.STEP_BACKWARD
]

GridActionPodcast.DEFAULTS = {
    id: '', //will be replaced by constructor
    modelName: GridActionPodcast.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    stepSeconds: 30,
    action: GridActionPodcast.actions.PLAY
};

export { GridActionPodcast };
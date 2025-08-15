import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';

class GridActionMessageHistory extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    action: [String],
    maxItems: [Number],
    sortBy: [String], // 'recent' or 'frequent'
    language: [String], // language filter, null for all languages
    searchTerm: [String], // optional search term filter
    showTimestamp: [Boolean],
    showFrequency: [Boolean]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridActionMessageHistory);
        super(properties);
        this.id = this.id || modelUtil.generateId(GridActionMessageHistory.getModelName());
    }

    static getModelName() {
        return 'GridActionMessageHistory';
    }
}

// Action types
GridActionMessageHistory.ACTION_SHOW_RECENT = 'ACTION_SHOW_RECENT';
GridActionMessageHistory.ACTION_SHOW_FREQUENT = 'ACTION_SHOW_FREQUENT';
GridActionMessageHistory.ACTION_SEARCH = 'ACTION_SEARCH';
GridActionMessageHistory.ACTION_CLEAR_HISTORY = 'ACTION_CLEAR_HISTORY';

GridActionMessageHistory.ACTIONS = [
    GridActionMessageHistory.ACTION_SHOW_RECENT,
    GridActionMessageHistory.ACTION_SHOW_FREQUENT,
    GridActionMessageHistory.ACTION_SEARCH,
    GridActionMessageHistory.ACTION_CLEAR_HISTORY
];

GridActionMessageHistory.defaults({
    id: '', // will be replaced by constructor
    modelName: GridActionMessageHistory.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    action: GridActionMessageHistory.ACTION_SHOW_RECENT,
    maxItems: 10,
    sortBy: 'recent',
    language: null, // null means all languages
    searchTerm: '',
    showTimestamp: true,
    showFrequency: false
});

export { GridActionMessageHistory };

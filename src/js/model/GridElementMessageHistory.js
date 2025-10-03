import { GridElement } from './GridElement.js';
import { GridActionMessageHistory } from './GridActionMessageHistory.js';

class GridElementMessageHistory extends GridElement.extend({
    maxItems: [Number],
    sortBy: [String],
    language: [String],
    showTimestamp: [Boolean],
    showFrequency: [Boolean],
    itemHeight: [Number], // Height of each history item in pixels
    scrollable: [Boolean] // Whether the history list should be scrollable
}) {
    constructor(props) {
        props = props || {};
        props.maxItems = props.maxItems !== undefined ? props.maxItems : 10;
        props.sortBy = props.sortBy || 'recent';
        props.language = props.language || null; // null means all languages
        props.showTimestamp = props.showTimestamp !== undefined ? props.showTimestamp : true;
        props.showFrequency = props.showFrequency !== undefined ? props.showFrequency : false;
        props.itemHeight = props.itemHeight || 40;
        props.scrollable = props.scrollable !== undefined ? props.scrollable : true;
        props.type = GridElement.ELEMENT_TYPE_MESSAGE_HISTORY;
        props.actions = props.actions || [
            new GridActionMessageHistory({ 
                action: GridActionMessageHistory.ACTION_SHOW_RECENT,
                maxItems: props.maxItems,
                sortBy: props.sortBy,
                language: props.language,
                showTimestamp: props.showTimestamp,
                showFrequency: props.showFrequency
            })
        ];
        super(props);
    }
}

// Sort options
GridElementMessageHistory.SORT_RECENT = 'recent';
GridElementMessageHistory.SORT_FREQUENT = 'frequent';
GridElementMessageHistory.SORT_OPTIONS = [
    GridElementMessageHistory.SORT_RECENT,
    GridElementMessageHistory.SORT_FREQUENT
];

export { GridElementMessageHistory };

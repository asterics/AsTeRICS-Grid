import { GridElement } from './GridElement.js';

class GridElementDisplay extends GridElement.extend({
    mode: [String],
    updateSeconds: [Number],
    httpAction: [Object],
    dateTimeFormat: [String]
}) {
    constructor(props) {
        props = props || {};
        let defaults = JSON.parse(JSON.stringify(GridElementDisplay.DEFAULTS));
        super(Object.assign(defaults, props));
    }
}

GridElementDisplay.MODE_HTTP_REQUEST = 'MODE_HTTP_REQUEST';
GridElementDisplay.MODE_DATETIME = 'MODE_DATETIME';
GridElementDisplay.MODE_APP_STATE = 'MODE_APP_STATE';

GridElementDisplay.DT_FORMAT_DATE = 'DT_FORMAT_DATE'; // new Date().toLocaleDateString()
GridElementDisplay.DT_FORMAT_DATE_LONG = 'DT_FORMAT_DATE_LONG'; // new Date().toLocaleDateString('en', {weekday: 'long',month: 'long',day: 'numeric',year: 'numeric'})
GridElementDisplay.DT_FORMAT_TIME = 'DT_FORMAT_TIME'; // new Date().toLocaleTimeString(undefined, {hour: 'numeric',minute: 'numeric'})
GridElementDisplay.DT_FORMAT_TIME_LONG = 'DT_FORMAT_TIME_LONG'; // new Date().toLocaleTimeString('en', {hour: 'numeric',minute: 'numeric', second: 'numeric'})
GridElementDisplay.DT_FORMAT_DATETIME = 'DT_FORMAT_DATETIME'; // new Date().toLocaleString()
GridElementDisplay.DT_FORMAT_WEEKDAY = 'DT_FORMAT_WEEKDAY'; // new Date().toLocaleString(undefined, {  weekday: 'long' }))
GridElementDisplay.DT_FORMAT_WEEKDAY = 'DT_FORMAT_MONTH'; // new Date().toLocaleString(undefined, {  month: 'long' }))

GridElementDisplay.DEFAULTS = {
    mode: GridElementDisplay.MODE_DATETIME,
    dateTimeFormat: GridElementDisplay.DT_FORMAT_TIME_LONG,
    updateSeconds: 1
}

export { GridElementDisplay };
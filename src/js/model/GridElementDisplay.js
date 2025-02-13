import { GridElement } from './GridElement.js';

class GridElementDisplay extends GridElement.extend({
    mode: [String],
    updateSeconds: [Number],
    displayAction: [Object],
    dateTimeFormat: [String],
    appState: [String],
    extractMode: [String],
    extractInfo: [String, Number, undefined], //e.g. path like "info.name" for JSON; a querySelector like #id for HTML mode; startIndex for substring
    extractInfo2: [String, Number, undefined], //e.g. endIndex for substring; index for HTML selector
    chooseValues: [String] // array of values to choose from, semicolon separated
}) {
    constructor(props) {
        props = props || {};
        let defaults = JSON.parse(JSON.stringify(GridElementDisplay.DEFAULTS));
        super(Object.assign(defaults, props));
    }
}

GridElementDisplay.MODE_ACTION_RESULT = 'MODE_ACTION_RESULT';
GridElementDisplay.MODE_DATETIME = 'MODE_DATETIME';
GridElementDisplay.MODE_APP_STATE = 'MODE_APP_STATE';
GridElementDisplay.MODE_RANDOM = 'MODE_RANDOM';
GridElementDisplay.MODES = [GridElementDisplay.MODE_DATETIME, GridElementDisplay.MODE_APP_STATE, GridElementDisplay.MODE_ACTION_RESULT, GridElementDisplay.MODE_RANDOM];

GridElementDisplay.DT_FORMAT_DATE = 'DT_FORMAT_DATE';
GridElementDisplay.DT_FORMAT_DATE_LONG = 'DT_FORMAT_DATE_LONG';
GridElementDisplay.DT_FORMAT_TIME = 'DT_FORMAT_TIME';
GridElementDisplay.DT_FORMAT_TIME_LONG = 'DT_FORMAT_TIME_LONG';
GridElementDisplay.DT_FORMAT_DATETIME = 'DT_FORMAT_DATETIME';
GridElementDisplay.DT_FORMAT_WEEKDAY = 'DT_FORMAT_WEEKDAY';
GridElementDisplay.DT_FORMAT_MONTH = 'DT_FORMAT_MONTH';
GridElementDisplay.DT_FORMATS = [GridElementDisplay.DT_FORMAT_DATE, GridElementDisplay.DT_FORMAT_DATE_LONG, GridElementDisplay.DT_FORMAT_TIME, GridElementDisplay.DT_FORMAT_TIME_LONG, GridElementDisplay.DT_FORMAT_DATETIME, GridElementDisplay.DT_FORMAT_WEEKDAY, GridElementDisplay.DT_FORMAT_MONTH];

GridElementDisplay.APP_STATE_VOLUME_GLOBAL = 'APP_STATE_VOLUME_GLOBAL';
GridElementDisplay.APP_STATE_VOLUME_YT = 'APP_STATE_VOLUME_YT';
GridElementDisplay.APP_STATE_VOLUME_RADIO = 'APP_STATE_VOLUME_RADIO';
GridElementDisplay.APP_STATES = [GridElementDisplay.APP_STATE_VOLUME_GLOBAL, GridElementDisplay.APP_STATE_VOLUME_RADIO, GridElementDisplay.APP_STATE_VOLUME_YT]

GridElementDisplay.EXTRACT_JSON = "EXTRACT_JSON";
GridElementDisplay.EXTRACT_HTML_SELECTOR = "EXTRACT_HTML_SELECTOR";
GridElementDisplay.EXTRACT_MODES = [GridElementDisplay.EXTRACT_JSON, GridElementDisplay.EXTRACT_HTML_SELECTOR];

GridElementDisplay.DEFAULTS = {
    extractMode: GridElementDisplay.EXTRACT_JSON
};

export { GridElementDisplay };
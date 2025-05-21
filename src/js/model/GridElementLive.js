import { GridElement } from './GridElement.js';

class GridElementLive extends GridElement.extend({
    mode: [String],
    updateSeconds: [Number],
    liveAction: [Object],
    dateTimeFormat: [String],
    state: [String],
    appState: [String],
    extractMode: [String],
    extractSelector: [String, Number, undefined], //e.g. path like "info.name" for JSON; a querySelector like #id for HTML mode; startIndex for substring
    extractIndex: [String, Number, undefined], //e.g. endIndex for substring; index for HTML selector
    extractMappings: [Object], // extracted values -> replacement values, e.g. "true" -> "on"
    chooseValues: [String] // array of values to choose from, semicolon separated
}) {
    constructor(props) {
        props = props || {};
        let defaults = JSON.parse(JSON.stringify(GridElementLive.DEFAULTS));
        super(Object.assign(defaults, props));
    }
}

GridElementLive.MODE_ACTION_RESULT = 'MODE_ACTION_RESULT';
GridElementLive.MODE_DATETIME = 'MODE_DATETIME';
GridElementLive.MODE_APP_STATE = 'MODE_APP_STATE';
GridElementLive.MODE_RANDOM = 'MODE_RANDOM';
GridElementLive.MODE_PODCAST_STATE = 'MODE_PODCAST_STATE';
GridElementLive.MODES = [GridElementLive.MODE_DATETIME, GridElementLive.MODE_APP_STATE, GridElementLive.MODE_ACTION_RESULT, GridElementLive.MODE_RANDOM, GridElementLive.MODE_PODCAST_STATE];

GridElementLive.DT_FORMAT_DATE = 'DT_FORMAT_DATE';
GridElementLive.DT_FORMAT_DATE_LONG = 'DT_FORMAT_DATE_LONG';
GridElementLive.DT_FORMAT_TIME = 'DT_FORMAT_TIME';
GridElementLive.DT_FORMAT_TIME_LONG = 'DT_FORMAT_TIME_LONG';
GridElementLive.DT_FORMAT_DATETIME = 'DT_FORMAT_DATETIME';
GridElementLive.DT_FORMAT_WEEKDAY = 'DT_FORMAT_WEEKDAY';
GridElementLive.DT_FORMAT_MONTH = 'DT_FORMAT_MONTH';
GridElementLive.DT_FORMATS = [GridElementLive.DT_FORMAT_DATE, GridElementLive.DT_FORMAT_DATE_LONG, GridElementLive.DT_FORMAT_TIME, GridElementLive.DT_FORMAT_TIME_LONG, GridElementLive.DT_FORMAT_DATETIME, GridElementLive.DT_FORMAT_WEEKDAY, GridElementLive.DT_FORMAT_MONTH];

GridElementLive.APP_STATE_VOLUME_GLOBAL = 'APP_STATE_VOLUME_GLOBAL';
GridElementLive.APP_STATE_VOLUME_YT = 'APP_STATE_VOLUME_YT';
GridElementLive.APP_STATE_VOLUME_RADIO = 'APP_STATE_VOLUME_RADIO';
GridElementLive.APP_STATE_BATTERY_LEVEL = 'APP_STATE_BATTERY_LEVEL';
GridElementLive.APP_STATES = [GridElementLive.APP_STATE_VOLUME_GLOBAL, GridElementLive.APP_STATE_VOLUME_RADIO, GridElementLive.APP_STATE_VOLUME_YT, GridElementLive.APP_STATE_BATTERY_LEVEL];

GridElementLive.PODCAST_CURRENT_PODCAST = 'PODCAST_CURRENT_PODCAST';
GridElementLive.PODCAST_CURRENT_EPISODE = 'PODCAST_CURRENT_EPISODE';
GridElementLive.PODCAST_PLAY_TIME = 'PODCAST_PLAY_TIME';
GridElementLive.PODCAST_REMAINING_TIME = 'PODCAST_REMAINING_TIME';
GridElementLive.PODCAST_STATES = [GridElementLive.PODCAST_CURRENT_PODCAST, GridElementLive.PODCAST_CURRENT_EPISODE, GridElementLive.PODCAST_PLAY_TIME, GridElementLive.PODCAST_REMAINING_TIME];

GridElementLive.EXTRACT_JSON = "EXTRACT_JSON";
GridElementLive.EXTRACT_HTML_SELECTOR = "EXTRACT_HTML_SELECTOR";
GridElementLive.EXTRACT_MODES = [GridElementLive.EXTRACT_JSON, GridElementLive.EXTRACT_HTML_SELECTOR];

GridElementLive.DEFAULTS = {
    extractMode: GridElementLive.EXTRACT_JSON
};

export { GridElementLive };
import { GridElement } from '../model/GridElement';
import { GridElementLive } from '../model/GridElementLive';
import $ from '../externals/jquery';
import { constants } from '../util/constants';
import { i18nService } from './i18nService';
import { localStorageService } from './data/localStorageService';
import { actionService } from './actionService';
import { util } from '../util/util';
import { podcastService } from './podcastService';

let liveElementService = {};

let CHECK_INTERVAL = 1000;
let DATA_PLACEHOLDER = '{0}';

let registeredElements = [];
let timeoutHandler = null;
let lastUpdateTimes = {}; // ID -> update time
let lastValues = {}; // ID -> value

/**
 * @param elements
 * @param options
 * @param options.once only update once, no automatic interval
 */
liveElementService.initWithElements = function(elements, options = {}) {
    liveElementService.stop();
    elements.forEach((element) => {
        if (element && element.type === GridElement.ELEMENT_TYPE_LIVE) {
            registeredElements.push(JSON.parse(JSON.stringify(element)));
        }
    });
    if (registeredElements.length > 0) {
        updateElements(options);
    }
};

/**
 *
 * @param options
 * @param options.elements optional elements to use for updating, otherwise currently registered elements are used
 * @param options.once only updates once, independent of automatic interval
 * @param options.updateModes optional array of strings defining the display element modes to be updated, e.g. [GridElementLive.MODE_DATETIME]
 * @param options.forceUpdate if set to true, getting the current value is forced and element.updateSeconds are ignored
 */
liveElementService.updateOnce = function(options = {}) {
    options.once = options.once !== undefined ? options.once : true;
    updateElements(options);
};

liveElementService.stop = function() {
    clearTimeout(timeoutHandler);
    registeredElements = [];
    lastValues = {};
    lastUpdateTimes = {};
}

liveElementService.getLastValue = function(elementId) {
    return lastValues[elementId] || '';
};

/**
 *
 * @param element
 * @param options
 * @param options.forceUpdate if set to true, getting the current value is forced and element.updateSeconds are ignored
 * @returns {Promise<string>}
 */
liveElementService.getCurrentValue = async function(element, options = {}) {
    options = JSON.parse(JSON.stringify(options));
    options.forceUpdate = options.forceUpdate || [GridElementLive.MODE_DATETIME, GridElementLive.MODE_APP_STATE, GridElementLive.MODE_PODCAST_STATE].includes(element.mode);
    let updateMs = (element.updateSeconds || 0) * 1000;
    let cacheBecauseTime = !options.forceUpdate && lastUpdateTimes[element.id] && new Date().getTime() - lastUpdateTimes[element.id] < updateMs;
    let cacheBecauseUpdateSeconds0 = !options.forceUpdate && !element.updateSeconds;
    if (lastValues[element.id] !== undefined && (cacheBecauseTime || cacheBecauseUpdateSeconds0)) {
        return lastValues[element.id];
    }
    lastUpdateTimes[element.id] = new Date().getTime();
    let value = '';
    switch (element.mode) {
        case GridElementLive.MODE_DATETIME:
            value = getValueDateTime(element);
            break;
        case GridElementLive.MODE_APP_STATE:
            value = await getValueAppState(element);
            break;
        case GridElementLive.MODE_ACTION_RESULT:
            value = await getValueActionResult(element, options);
            break;
        case GridElementLive.MODE_RANDOM:
            value = getValueRandom(element, options);
            break;
        case GridElementLive.MODE_PODCAST_STATE:
            value = getValuePodcast(element);
            break;
    }
    if (element.extractMappings && element.extractMappings[value]) {
        value = element.extractMappings[value];
    }
    value = i18nService.tPredefined(value);
    let currentLabel = i18nService.getTranslation(element.label) || '';
    return liveElementService.replacePlaceholder(element, currentLabel, value);
};

liveElementService.replacePlaceholder = function(element, text = '', dataText) {
    dataText = dataText !== undefined ? dataText : liveElementService.getLastValue(element.id);
    if (!dataText) {
        return text;
    }
    if (text.includes(DATA_PLACEHOLDER)) {
        text = text.replace(DATA_PLACEHOLDER, dataText);
    } else {
        text = text + dataText;
    }
    return text;
}

/**
 *
 * @param options
 * @param options.elements optional elements to use for updating, otherwise currently registered elements are used
 * @param options.once only updates once, independent of automatic interval
 * @param options.forceUpdate if set to true, getting the current value is forced and element.updateSeconds are ignored
 * @param options.updateModes optional array of strings defining the display element modes to be updated, e.g. [GridElementLive.MODE_DATETIME]
 */
function updateElements(options = {}) {
    if (!options.once) {
        clearTimeout(timeoutHandler);
    }
    let allElements = options.elements || registeredElements;
    let elementsToUpdate = allElements.filter(e => e.type === GridElement.ELEMENT_TYPE_LIVE && (!options.updateModes || options.updateModes.includes(e.mode)));
    for (let element of elementsToUpdate) {
        let valuePromise = liveElementService.getCurrentValue(element, options);
        valuePromise.then(value => {
            triggerTextEvent(element, value);
        });
    }
    if (!options.once) {
        timeoutHandler = setTimeout(updateElements, CHECK_INTERVAL);
    }
}

function getValueDateTime(element) {
    switch (element.dateTimeFormat) {
        case GridElementLive.DT_FORMAT_DATE:
            return getDateText(element);
        case GridElementLive.DT_FORMAT_DATE_LONG:
            return getDateText(element, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        case GridElementLive.DT_FORMAT_TIME:
            return getTimeText(element, { hour: 'numeric', minute: 'numeric' });
        case GridElementLive.DT_FORMAT_TIME_LONG:
            return getTimeText(element, { hour: 'numeric', minute: 'numeric', second: 'numeric' });
        case GridElementLive.DT_FORMAT_DATETIME:
            return getDateText(element, { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
        case GridElementLive.DT_FORMAT_WEEKDAY:
            return getDateText(element, { weekday: 'long' });
        case GridElementLive.DT_FORMAT_MONTH:
            return getDateText(element, { month: 'long' });
    }
    return '';
}

async function getValueAppState(element) {
    let userSettings = localStorageService.getUserSettings();
    switch (element.appState) {
        case GridElementLive.APP_STATE_VOLUME_GLOBAL:
            return userSettings.systemVolumeMuted ? i18nService.t("mutedBracket") : userSettings.systemVolume;
        case GridElementLive.APP_STATE_VOLUME_YT:
            return userSettings.ytState.muted ? i18nService.t("mutedBracket") : userSettings.ytState.volume;
        case GridElementLive.APP_STATE_VOLUME_RADIO:
            return Math.round(parseFloat(localStorageService.get(constants.WEBRADIO_LAST_VOLUME_KEY) || 1.0) * 100);
        case GridElementLive.APP_STATE_BATTERY_LEVEL:
            if(!navigator.getBattery) {
                log.warn("navigator.getBattery not supported!");
                return "?";
            }
            let batteryManager = await navigator.getBattery();
            return batteryManager.level * 100;
    }
    return '';
}

/**
 *
 * @param element
 * @param options
 * @param options.forceUpdate if set to true, getting the current value is forced and element.updateSeconds are ignored
 * @returns {Promise<string|*>}
 */
async function getValueActionResult (element, options = {}) {
    let result = await actionService.testAction(element, element.liveAction);
    switch (element.extractMode) {
        case GridElementLive.EXTRACT_JSON:
            return extractFromJson(element, result);
        case GridElementLive.EXTRACT_HTML_SELECTOR:
            return extractFromHTML(element, result);
    }
    return '';
}

function getValueRandom(element) {
    let valuesString = element.chooseValues || '';
    let values = valuesString.split(";");
    let index = util.getRandomInt(0, values.length - 1);
    return values[index];
}

function getValuePodcast(element) {
    let state = podcastService.getState();
    switch (element.state) {
        case GridElementLive.PODCAST_CURRENT_PODCAST:
            return state.podcastTitle;
        case GridElementLive.PODCAST_CURRENT_EPISODE:
            return state.episodeTitle;
        case GridElementLive.PODCAST_PLAY_TIME:
            return formatDuration(state.currentSeconds);
        case GridElementLive.PODCAST_REMAINING_TIME:
            return formatDuration(state.remainingSeconds);
    }
}

function extractFromJson(element, text) {
    let selector = element.extractSelector || '';
    let path = selector.split('.');
    let jsonObject = null;
    try {
        jsonObject = JSON.parse(text);
    } catch (e) {
        return '';
    }
    while (path.length > 0) {
        let part = path.shift();
        jsonObject = jsonObject[part] !== undefined ? jsonObject[part] : jsonObject;
    }
    let returnValue = jsonObject === undefined ? '' : jsonObject;
    returnValue = returnValue !== Object(returnValue) ? returnValue : JSON.stringify(returnValue); // stringify if not a primitive value
    return returnValue + '';
}

function extractFromHTML(element, text) {
    let selector = element.extractSelector || '';
    let index = !isNaN(parseInt(element.extractIndex)) ? parseInt(element.extractIndex) : null;
    const parser = new DOMParser();
    try {
        const doc = parser.parseFromString(text, 'text/html');
        const elements = selector ? doc.querySelectorAll(selector) : [doc.documentElement];
        let result = '';
        for (let i = 0; i < elements.length; i++) {
            if (index === null || i === index) {
                result += elements[i].textContent.replace(/\s+/g, ' ').trim() + '\n';
            }
        }
        return result;
    } catch (e) {
        log.warn("failed to parse HTML", e);
    }
    return '';
}

function getDateText(element, options) {
    return new Date().toLocaleDateString(i18nService.getContentLang(), options);
}

function getTimeText(element, options) {
    return new Date().toLocaleTimeString(i18nService.getContentLang(), options);
}

function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const paddedMins = String(mins).padStart(2, '0');
    const paddedSecs = String(secs).padStart(2, '0');

    if (hrs > 0) {
        const paddedHrs = String(hrs).padStart(2, '0');
        return `${paddedHrs}:${paddedMins}:${paddedSecs}`;
    }

    return `${paddedMins}:${paddedSecs}`;
}

function triggerTextEvent(element, text) {
    text = text + '';
    let prevValue = lastValues[element.id];
    if (prevValue !== text) {
        $(document).trigger(constants.EVENT_ELEM_TEXT_CHANGED, [element.id, text]);
        lastValues[element.id] = text;
    }
}

export { liveElementService };
import { GridElement } from '../model/GridElement';
import { GridElementDisplay } from '../model/GridElementDisplay';
import $ from '../externals/jquery';
import { constants } from '../util/constants';
import { i18nService } from './i18nService';
import { localStorageService } from './data/localStorageService';
import { actionService } from './actionService';
import { util } from '../util/util';

let displayElementService = {};

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
displayElementService.initWithElements = function(elements, options = {}) {
    displayElementService.stop();
    elements.forEach((element) => {
        if (element && element.type === GridElement.ELEMENT_TYPE_DISPLAY) {
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
 * @param options.updateModes optional array of strings defining the display element modes to be updated, e.g. [GridElementDisplay.MODE_DATETIME]
 *
 */
displayElementService.updateOnce = function(options = {}) {
    options.once = options.once !== undefined ? options.once : true;
    updateElements(options);
};

displayElementService.stop = function() {
    clearTimeout(timeoutHandler);
    registeredElements = [];
    lastValues = {};
    lastUpdateTimes = {};
}

displayElementService.getLastValue = function(elementId) {
    return lastValues[elementId] || '';
};

/**
 *
 * @param element
 * @param options
 * @param options.forceUpdate if set to true, getting the current value is forced and element.updateSeconds are ignored
 * @returns {Promise<string>}
 */
displayElementService.getCurrentValue = async function(element, options = {}) {
    options.forceUpdate = options.forceUpdate || [GridElementDisplay.MODE_DATETIME, GridElementDisplay.MODE_APP_STATE].includes(element.mode);
    let updateMs = (element.updateSeconds || 0) * 1000;
    let cacheBecauseTime = !options.forceUpdate && lastUpdateTimes[element.id] && new Date().getTime() - lastUpdateTimes[element.id] < updateMs;
    let cacheBecauseUpdateSeconds0 = !options.forceUpdate && !element.updateSeconds;
    if (lastValues[element.id] && (cacheBecauseTime || cacheBecauseUpdateSeconds0)) {
        return lastValues[element.id];
    }
    lastUpdateTimes[element.id] = new Date().getTime();
    switch (element.mode) {
        case GridElementDisplay.MODE_DATETIME:
            return getValueDateTime(element);
        case GridElementDisplay.MODE_APP_STATE:
            return getValueAppState(element);
        case GridElementDisplay.MODE_ACTION_RESULT:
            return await getValueActionResult(element, options);
        case GridElementDisplay.MODE_RANDOM:
            return getValueRandom(element, options);
    }
};

displayElementService.replacePlaceholder = function(element, text = '', dataText) {
    dataText = dataText || displayElementService.getLastValue(element.id);
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
 * @param options.updateModes optional array of strings defining the display element modes to be updated, e.g. [GridElementDisplay.MODE_DATETIME]
 */
function updateElements(options = {}) {
    if (!options.once) {
        clearTimeout(timeoutHandler);
    }
    let allElements = options.elements || registeredElements;
    let elementsToUpdate = allElements.filter(e => e.type === GridElement.ELEMENT_TYPE_DISPLAY && (!options.updateModes || options.updateModes.includes(e.mode)));
    for (let element of elementsToUpdate) {
        let valuePromise = displayElementService.getCurrentValue(element, options);
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
        case GridElementDisplay.DT_FORMAT_DATE:
            return getDateText(element);
        case GridElementDisplay.DT_FORMAT_DATE_LONG:
            return getDateText(element, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        case GridElementDisplay.DT_FORMAT_TIME:
            return getTimeText(element, { hour: 'numeric', minute: 'numeric' });
        case GridElementDisplay.DT_FORMAT_TIME_LONG:
            return getTimeText(element, { hour: 'numeric', minute: 'numeric', second: 'numeric' });
        case GridElementDisplay.DT_FORMAT_DATETIME:
            return getDateText(element, { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
        case GridElementDisplay.DT_FORMAT_WEEKDAY:
            return getDateText(element, { weekday: 'long' });
        case GridElementDisplay.DT_FORMAT_MONTH:
            return getDateText(element, { month: 'long' });
    }
    return '';
}

function getValueAppState(element) {
    let userSettings = localStorageService.getUserSettings();
    switch (element.appState) {
        case GridElementDisplay.APP_STATE_VOLUME_GLOBAL:
            return userSettings.systemVolumeMuted ? i18nService.t("mutedBracket") : userSettings.systemVolume;
        case GridElementDisplay.APP_STATE_VOLUME_YT:
            return userSettings.ytState.muted ? i18nService.t("mutedBracket") : userSettings.ytState.volume;
        case GridElementDisplay.APP_STATE_VOLUME_RADIO:
            return Math.round(parseFloat(localStorageService.get(constants.WEBRADIO_LAST_VOLUME_KEY) || 1.0) * 100);
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
    let result = await actionService.testAction(element, element.displayAction);
    switch (element.extractMode) {
        case GridElementDisplay.EXTRACT_JSON:
            return extractFromJson(element, result);
        case GridElementDisplay.EXTRACT_HTML_SELECTOR:
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

function extractFromJson(element, text) {
    let info = element.extractInfo || '';
    let path = info.split('.');
    let jsonObject = null;
    try {
        jsonObject = JSON.parse(text);
    } catch (e) {
        return '';
    }
    while (path.length > 0) {
        let part = path.shift();
        jsonObject = jsonObject[part] ? jsonObject[part] : jsonObject;
    }
    return jsonObject || '';
}

function extractFromHTML(element, text) {
    let selector = element.extractInfo || '';
    let index = !isNaN(parseInt(element.extractInfo2)) ? parseInt(element.extractInfo2) : null;
    if (!selector) {
        return text;
    }
    const parser = new DOMParser();
    try {
        const doc = parser.parseFromString(text, 'text/html');
        const elements = doc.querySelectorAll(selector);
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

function triggerTextEvent(element, dataText) {
    dataText = dataText + '';
    let prevValue = lastValues[element.id];
    let currentLabel = i18nService.getTranslation(element.label) || '';
    let text = displayElementService.replacePlaceholder(element, currentLabel, dataText);
    if (prevValue !== text) {
        $(document).trigger(constants.EVENT_DISPLAY_ELEM_CHANGED, [element.id, text]);
        lastValues[element.id] = text;
    }
}

export { displayElementService };
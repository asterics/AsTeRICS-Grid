import { GridElement } from '../model/GridElement';
import { GridElementDisplay } from '../model/GridElementDisplay';
import $ from '../externals/jquery';
import { constants } from '../util/constants';
import { i18nService } from './i18nService';
import { localStorageService } from './data/localStorageService';

let displayElementService = {};

let CHECK_INTERVAL = 1000;
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

displayElementService.getCurrentValue = function(element) {
    switch (element.mode) {
        case GridElementDisplay.MODE_DATETIME:
            return getElementDateTime(element);
        case GridElementDisplay.MODE_APP_STATE:
            return getElementAppState(element);
        case GridElementDisplay.MODE_HTTP_REQUEST:
            return getElementHTTP(element);
    }
};

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
        let value = displayElementService.getCurrentValue(element);
        triggerTextEvent(element, value);
    }
    if (!options.once) {
        timeoutHandler = setTimeout(updateElements, CHECK_INTERVAL);
    }
}

function getElementDateTime(element) {
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
}

function getElementAppState(element) {
    let userSettings = localStorageService.getUserSettings();
    switch (element.appState) {
        case GridElementDisplay.APP_STATE_VOLUME_GLOBAL:
            return userSettings.systemVolumeMuted ? i18nService.t("mutedBracket") : userSettings.systemVolume;
        case GridElementDisplay.APP_STATE_VOLUME_YT:
            return userSettings.ytState.muted ? i18nService.t("mutedBracket") : userSettings.ytState.volume;
    }
}

function getElementHTTP(element) {
    let updateMs = (element.updateSeconds || 10) * 1000;
    if (lastUpdateTimes[element.id] && new Date().getTime() - lastUpdateTimes[element.id] < updateMs) {
        return;
    }
    lastUpdateTimes[element.id] = new Date().getTime();
    log.warn('updating HTTP display element');
    return '';
}

function getDateText(element, options) {
    return new Date().toLocaleDateString(i18nService.getContentLang(), options);
}

function getTimeText(element, options) {
    return new Date().toLocaleTimeString(i18nService.getContentLang(), options);
}

function triggerTextEvent(element, text) {
    text = text + '';
    let prevValue = lastValues[element.id];
    if (prevValue !== text) {
        $(document).trigger(constants.EVENT_DISPLAY_ELEM_CHANGED, [element.id, text]);
        lastValues[element.id] = text;
    }
}

export { displayElementService };
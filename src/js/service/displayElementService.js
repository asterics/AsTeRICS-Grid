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
    let elementsToUpdate = allElements.filter(e => !options.updateModes || options.updateModes.includes(e.mode));
    for (let element of elementsToUpdate) {
        switch (element.mode) {
            case GridElementDisplay.MODE_DATETIME:
                updateElementDateTime(element);
                break;
            case GridElementDisplay.MODE_APP_STATE:
                updateElementAppState(element);
                break;
            case GridElementDisplay.MODE_HTTP_REQUEST:
                updateElementHTTP(element);
                break;
        }
    }
    if (!options.once) {
        timeoutHandler = setTimeout(updateElements, CHECK_INTERVAL);
    }
}

function updateElementDateTime(element) {
    switch (element.dateTimeFormat) {
        case GridElementDisplay.DT_FORMAT_DATE:
            triggerDateEvent(element);
            break;
        case GridElementDisplay.DT_FORMAT_DATE_LONG:
            triggerDateEvent(element, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            break;
        case GridElementDisplay.DT_FORMAT_TIME:
            triggerTimeEvent(element, { hour: 'numeric', minute: 'numeric' });
            break;
        case GridElementDisplay.DT_FORMAT_TIME_LONG:
            triggerTimeEvent(element, { hour: 'numeric', minute: 'numeric', second: 'numeric' });
            break;
        case GridElementDisplay.DT_FORMAT_DATETIME:
            triggerDateEvent(element, { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
            break;
        case GridElementDisplay.DT_FORMAT_WEEKDAY:
            triggerDateEvent(element, { weekday: 'long' });
            break;
        case GridElementDisplay.DT_FORMAT_MONTH:
            triggerDateEvent(element, { month: 'long' });
            break;
    }
}

function updateElementAppState(element) {
    let userSettings = localStorageService.getUserSettings();
    switch (element.appState) {
        case GridElementDisplay.APP_STATE_VOLUME_GLOBAL:
            triggerTextEvent(element, userSettings.systemVolumeMuted ? i18nService.t("mutedBracket") : userSettings.systemVolume);
            break;
        case GridElementDisplay.APP_STATE_VOLUME_YT:
            triggerTextEvent(element, userSettings.ytState.muted ? i18nService.t("mutedBracket") : userSettings.ytState.volume);
            break;
    }
}

function updateElementHTTP(element) {
    let updateMs = (element.updateSeconds || 10) * 1000;
    if (lastUpdateTimes[element.id] && new Date().getTime() - lastUpdateTimes[element.id] < updateMs) {
        return;
    }
    lastUpdateTimes[element.id] = new Date().getTime();
    log.warn('updating HTTP display element');
}

function triggerDateEvent(element, options) {
    triggerTextEvent(element, new Date().toLocaleDateString(i18nService.getContentLang(), options));
}

function triggerTimeEvent(element, options) {
    triggerTextEvent(element, new Date().toLocaleTimeString(i18nService.getContentLang(), options));
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
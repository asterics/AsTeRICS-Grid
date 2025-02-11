import { GridElement } from '../model/GridElement';
import { GridElementDisplay } from '../model/GridElementDisplay';
import $ from '../externals/jquery';
import { constants } from '../util/constants';

let displayElementService = {};
let registeredElements = [];
let timeoutHandler = null;
let CHECK_INTERVAL = 1000;

/**
 * @param elements
 * @param options
 * @param options.once only update once, no automatic interval
 */
displayElementService.initWithElements = function(elements, options = {}) {
    displayElementService.stop();
    elements.forEach((element) => {
        if (element && element.type === GridElement.ELEMENT_TYPE_DISPLAY) {
            registeredElements.push(JSON.parse(JSON.stringify(element))); // TODO!!!
        }
    });
    if (registeredElements.length > 0) {
        updateElements(options);
    }
};

displayElementService.updateOnce = function(elements) {
    displayElementService.initWithElements(elements, { once: true });
};

displayElementService.stop = function() {
    clearTimeout(timeoutHandler);
    registeredElements = [];
}

function updateElements(options = {}) {
    clearTimeout(timeoutHandler);
    for (let element of registeredElements) {
        switch (element.mode) {
            case GridElementDisplay.MODE_DATETIME:
                switch (element.dateTimeFormat) {
                    case GridElementDisplay.DT_FORMAT_DATE:
                        let text = new Date().toLocaleDateString();
                        $(document).trigger(constants.EVENT_DISPLAY_ELEM_CHANGED, [element.id, text]);
                        break;
                    case GridElementDisplay.DT_FORMAT_DATE_LONG:
                        $(document).trigger(constants.EVENT_DISPLAY_ELEM_CHANGED, [element.id, new Date().toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })]);
                        break;
                    case GridElementDisplay.DT_FORMAT_TIME:
                        $(document).trigger(constants.EVENT_DISPLAY_ELEM_CHANGED, [element.id, new Date().toLocaleTimeString(undefined, {hour: 'numeric',minute: 'numeric'})]);
                        break;
                    case GridElementDisplay.DT_FORMAT_TIME_LONG:
                        $(document).trigger(constants.EVENT_DISPLAY_ELEM_CHANGED, [element.id, new Date().toLocaleTimeString(undefined, {hour: 'numeric',minute: 'numeric', second: 'numeric'})]);
                        break;
                }
                break;
        }
    }
    if (!options.once) {
        timeoutHandler = setTimeout(updateElements, CHECK_INTERVAL);
    }
}

export { displayElementService };
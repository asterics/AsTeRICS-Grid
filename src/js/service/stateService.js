import $ from '../externals/jquery.js';
import { i18nService } from './i18nService.js';
import {GridElement} from "../model/GridElement.js";
import {constants} from "../util/constants.js";

let stateService = {};
let _states = {};
let _listeners = {};
let _currentGrid = null;
let _currentGlobalGrid = null;
let _currentWordFormTags = [];
let _currentWordFormIds = {}; //elementId -> id of word form list for current lang

stateService.setCurrentGrid = function (gridData) {
    _currentGrid = gridData;
};

stateService.setGlobalGrid = function (gridData) {
    _currentGlobalGrid = gridData;
};

stateService.hasGlobalGridElement = function (elementId) {
    if (!_currentGlobalGrid) {
        return false;
    }
    return _currentGlobalGrid.gridElements.some((e) => e.id === elementId);
};

stateService.addWordFormTags = function (tags, toggle) {
    _currentWordFormTags = stateService.mergeTags(_currentWordFormTags, tags, toggle);
    stateService.applyWordFormsToUI();
};

stateService.mergeTags = function (existingTags, newTags, toggle) {
    for (let tag of newTags) {
        if (toggle) {
            if (!existingTags.includes(tag)) {
                existingTags.push(tag);
            } else {
                existingTags = existingTags.filter((t) => t !== tag);
            }
        } else {
            existingTags.push(tag);
        }
    }
    return existingTags;
};

stateService.resetWordFormTags = function () {
    _currentWordFormTags = [];
    _currentWordFormIds = {};
    stateService.applyWordFormsToUI();
};

stateService.applyWordFormsToUI = function () {
    let elements = _currentGrid.gridElements;
    elements = _currentGlobalGrid ? elements.concat(_currentGlobalGrid.gridElements) : elements;
    for (let element of elements) {
        if (element.type === GridElement.ELEMENT_TYPE_NORMAL) {
            setTextInUI(element.id, stateService.getDisplayText(element.id));
        }
    }
};

stateService.getCurrentWordFormTags = function () {
    return JSON.parse(JSON.stringify(_currentWordFormTags));
};

/**
 * 
 * @param element
 * @param options.searchTags
 * @param options.wordFormId
 * @param options.searchSubTags
 * @return {null|*}
 */
stateService.getWordForm = function (element, options) {
    options.wordFormId = options.wordFormId === undefined ? _currentWordFormIds[element.id] : options.wordFormId;
    options.searchTags = options.searchTags ? JSON.parse(JSON.stringify(options.searchTags)) : undefined;
    if (options.wordFormId !== undefined) {
        let langForms = getWordFormsCurrentLang(element);
        return langForms[options.wordFormId].value;
    }
    if (!options.searchTags || options.searchTags.length === 0 || element.wordForms.length === 0) {
        return null;
    }
    while (options.searchTags.length > 0) {
        for (let index = 0; index < element.wordForms.length; index++) {
            let form = element.wordForms[index];
            if (
                (!form.lang || form.lang === i18nService.getContentLang()) &&
                options.searchTags.every((tag) => form.tags.includes(tag))
            ) {
                _currentWordFormIds[element.id] = index;
                return form.value;
            }
        }
        if (!options.searchSubTags) {
            return null;
        }
        options.searchTags.shift();
    }
    return null;
};

stateService.getBaseForm = function (element) {
    let baseForm = element.wordForms.filter(
        (f) =>
            (!f.lang || f.lang === i18nService.getContentLang()) &&
            (f.tags.length === 0 || (f.tags.length === 1 && f.tags[0] === constants.WORDFORM_TAG_BASE))
    )[0];
    return baseForm ? baseForm.value : null;
}

stateService.getDisplayText = function (elementId) {
    let element = getElement(elementId);
    if (!element) {
        return '';
    }
    return stateService.getWordForm(element, {searchTags: _currentWordFormTags, searchSubTags: true}) || stateService.getBaseForm(element) || i18nService.getTranslation(element.label);
};

stateService.getCurrentWordFormAllLangs = function (elementId) {
    let langWordFormMap = {};
    let element = getElement(elementId);
    if (!element) {
        return '';
    }
    for (let form of element.wordForms) {
        if (_currentWordFormTags.every((tag) => form.tags.includes(tag))) {
            if (form.lang && !Object.keys(langWordFormMap).includes(form.lang)) {
                langWordFormMap[form.lang] = form.value;
            }
        }
    }
    return langWordFormMap;
};

stateService.getCurrentUIWordForm = function (elementId) {
    return getTextInUI(elementId);
}

stateService.nextWordForm = function (elementId) {
    let element = getElement(elementId);
    if (!element) {
        return;
    }
    let currentId = _currentWordFormIds[element.id] || 0;
    let currentLangForms = getWordFormsCurrentLang(element);
    let nextId = currentId < currentLangForms.length - 1 ? currentId + 1 : 0;
    setTextInUI(element.id, currentLangForms[nextId].value);
    _currentWordFormIds[element.id] = nextId;
    return currentId;
};

/**
 * sets a state by key that is valid for this session of the application
 * @param key
 * @param state
 */
stateService.setState = function (key, state) {
    let originalState = _states[key];
    if (originalState !== state) {
        _states[key] = state;
        _listeners[key] = _listeners[key] || [];
        _listeners[key].forEach((fn) => {
            fn(state);
        });
    }
};

/**
 * retrieves a state by key that was previously set by stateService.setState()
 * @param key
 * @return {*}
 */
stateService.getState = function (key) {
    return _states[key];
};

/**
 * makes it possible to register a function that is called if the state defined by "key" changes
 * @param key
 * @param fn the listener function (callback) to be called if state changes
 */
stateService.onStateChanged = function (key, fn) {
    _listeners[key] = _listeners[key] || [];
    _listeners[key].push(fn);
};

/**
 * clear listeners previously added with stateService.onStateChanged()
 * @param key
 */
stateService.clearListeners = function (key) {
    if (!key) {
        _listeners = {};
    } else {
        _listeners[key] = [];
    }
};

function getElement(id) {
    if (!_currentGrid || !id) {
        return null;
    }
    return (
        _currentGrid.gridElements.filter((e) => e.id === id)[0] ||
        _currentGlobalGrid.gridElements.filter((e) => e.id === id)[0]
    );
}

function setTextInUI (elementId, text) {
    $(`#${elementId} .text-container span`).text(text);
}

function getTextInUI (elementId) {
    return $(`#${elementId} .text-container span`).text().trim();
}

function getWordFormsCurrentLang(element) {
    return element.wordForms.filter((form) => !form.lang || form.lang === i18nService.getContentLang());
}

export { stateService };

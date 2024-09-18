import $ from '../externals/jquery.js';
import { i18nService } from './i18nService.js';
import {GridElement} from "../model/GridElement.js";
import {constants} from "../util/constants.js";
import {util} from "../util/util.js";
import {speechService} from "./speechService.js";
import {dataService} from "./data/dataService.js";
import {GridActionWordForm} from "../model/GridActionWordForm.js";

let stateService = {};
let _states = {};
let _listeners = {};
let _currentGrid = null;
let _currentGlobalGrid = null;
let _currentWordFormTags = [];
let _currentWordFormIds = {}; //elementId -> id of word form list (for current lang!)
let _currentWordFormTagsOfElements = {}; //elementId -> list of tags for currently shown wordForm
let _convertMode = null;

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

stateService.resetWordForms = function () {
    _currentWordFormTags = [];
    _currentWordFormTagsOfElements = {};
    _currentWordFormIds = {};
    stateService.applyWordFormsToUI();
};

stateService.resetWordFormTags = function () {
    _currentWordFormTags = [];
}

stateService.resetWordFormIds = function (currentElement) {
    let keep = null;
    if (currentElement && hasNextWordFormAction(currentElement)) {
        keep = _currentWordFormIds[currentElement.id];
    }
    _currentWordFormIds = {};
    if (keep) {
        _currentWordFormIds[currentElement.id] = keep;
    }
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
 * returns the value of a word form with given options
 * @param element
 * @param options.searchTags (optional) a list of tags to search
 * @param options.wordFormId (optional) the id (index) of the word form to retrieve
 * @param options.searchSubTags if true, given searchTags are reduced using "shift()" until a valid word form is found
 * @return {null|*}
 */
stateService.getWordForm = function (element, options) {
    let object = stateService.getWordFormObject(element, options);
    return object ? object.value : null;
}

/**
 * returns an object {wordForm: <wordFormObject>, id: <index>} for the given options
 * @param element
 * @param options.searchTags (optional) a list of tags to search
 * @param options.wordFormId (optional) the id (index) of the word form to retrieve
 * @param options.searchSubTags if true, given searchTags are reduced using "shift()" until a valid word form is found
 * @param options.lang (optional) lang to return
 * @return {{wordForm: *, id}|null|{wordForm, id: number}}
 */
stateService.getWordFormObject = function (element, options) {
    options.wordFormId = options.wordFormId === undefined ? _currentWordFormIds[element.id] : options.wordFormId;
    options.searchTags = options.searchTags ? options.searchTags : _currentWordFormTags;
    options.searchTags = JSON.parse(JSON.stringify(options.searchTags));
    options.lang = options.lang || i18nService.getContentLang();
    if (options.wordFormId !== undefined) {
        let langForms = stateService.getWordFormsForLang(element, options.lang);
        return langForms[options.wordFormId];
    }
    if (!options.searchTags || options.searchTags.length === 0 || element.wordForms.length === 0) {
        return null;
    }
    while (options.searchTags.length > 0) {
        for (let index = 0; index < element.wordForms.length; index++) {
            let form = element.wordForms[index];
            if (
                (!form.lang || form.lang === options.lang) &&
                options.searchTags.every((tag) => form.tags.includes(tag))
            ) {
                _currentWordFormTagsOfElements[element.id] = options.searchTags;
                return form;
            }
        }
        if (!options.searchSubTags) {
            return null;
        }
        options.searchTags.shift();
    }
    return null;
};

/**
 * returns a list of all word forms for the given language
 * If word forms for exact given language (localized, e.g. "en-us") are not existing,
 * word forms for base language (e.g. "en") or other localized languages (e.g. "en-gb") are returned.
 * Word forms without language are returned always.
 *
 * @param element
 * @param lang
 * @returns {T[]}
 */
stateService.getWordFormsForLang = function(element, lang = '') {
    lang = lang || i18nService.getContentLang();
    let formsLang = element.wordForms.filter((form) => !form.lang || form.lang === lang);
    let formsBaseLang = element.wordForms.filter((form) => !form.lang || i18nService.getBaseLang(form.lang) === i18nService.getBaseLang(lang));
    return formsLang.length > 0 ? formsLang : formsBaseLang;
};

stateService.getFirstForm = function(element, lang) {
    let object = stateService.getFirstFormObject(element, lang);
    return object ? object.value : null;
};

stateService.getFirstFormObject = function(element, lang) {
    let forms = stateService.getWordFormsForLang(element, lang);
    return forms.length > 0 ? forms[0] : null;
};

stateService.getDisplayText = function (elementId) {
    let element = getElement(elementId);
    if (!element) {
        return '';
    }
    return stateService.getWordForm(element, {searchTags: _currentWordFormTags, searchSubTags: true}) || stateService.getFirstForm(element) || i18nService.getTranslation(element.label);
};

stateService.getSpeakText = function (elementId, options) {
    let element = elementId.id ? elementId : getElement(elementId);
    if (!element) {
        return '';
    }
    options = options || {};
    options.searchSubTags = true;
    let wordForm = stateService.getWordFormObject(element, options) || {};
    if (wordForm.pronunciation || wordForm.value) {
        return wordForm.pronunciation || wordForm.value;
    }
    let baseForm = stateService.getFirstFormObject(element, options.lang) || {};
    return (
        baseForm.pronunciation ||
        baseForm.value ||
        i18nService.getTranslation(element.label, {lang: options.lang}) ||
        i18nService.getTranslation(element.label)
    );
};

stateService.getSpeakTextAllLangs = function (elementId) {
    let langWordFormMap = {};
    let element = getElement(elementId);
    if (!element) {
        return '';
    }
    let possibleLangs = element.wordForms.map((e) => e.lang);
    let secondaryVoiceLang = speechService.getSecondaryVoiceLang();
    if (secondaryVoiceLang) {
        possibleLangs.push(secondaryVoiceLang);
    }
    possibleLangs = util.deduplicateArray(possibleLangs);
    for (let lang of possibleLangs) {
        langWordFormMap[lang] = stateService.getSpeakText(element, { lang: lang });
    }
    if (!langWordFormMap[i18nService.getContentLang()]) {
        langWordFormMap[i18nService.getContentLang()] = stateService.getSpeakText(element);
    }
    return langWordFormMap;
};

stateService.nextWordForm = function (elementId) {
    let element = getElement(elementId);
    if (!element) {
        return;
    }
    let currentLangForms = stateService.getWordFormsForLang(element);

    // all indexes that match current language
    let possibleIndexes = currentLangForms.map((form, index) => {
        return index;
    });
    if (currentLangForms.length === 0) {
        return;
    }
    let currentWordFormObject = this.getWordFormObject(element, { searchTags: _currentWordFormTags, searchSubTags: true });

    // limit to all indexes that match current tags
    let currentTags = _currentWordFormTagsOfElements[element.id] || []
    possibleIndexes = possibleIndexes.filter(index => currentTags.every((tag) => currentLangForms[index].tags.includes(tag)));

    // get id of current word form object
    let currentObjectIndex = currentLangForms.indexOf(currentWordFormObject);
    currentObjectIndex = currentObjectIndex >= 0 ? currentObjectIndex : null;
    let currentId = _currentWordFormIds[element.id] || currentObjectIndex || possibleIndexes[0];

    // filter out duplicate values
    let newPossibleIndexes = [];
    let takenForms = [];
    for (let index of possibleIndexes) {
        if (index === currentId || !takenForms.includes(currentLangForms[index].value)) {
            takenForms.push(currentLangForms[index].value);
            newPossibleIndexes.push(index);
        }
    }
    possibleIndexes = newPossibleIndexes;

    // get next id
    let indexOfIndexes = possibleIndexes.indexOf(currentId);
    indexOfIndexes = indexOfIndexes >= 0 ? indexOfIndexes : 0;
    let nextIndexOfIndexes = indexOfIndexes < possibleIndexes.length - 1 ? indexOfIndexes + 1 : 0;
    let nextId = possibleIndexes[nextIndexOfIndexes];

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
    let globalGridElements = _currentGlobalGrid ? _currentGlobalGrid.gridElements : [];
    return (
        _currentGrid.gridElements.filter((e) => e.id === id)[0] ||
        globalGridElements.filter((e) => e.id === id)[0]
    );
}

function setTextInUI (elementId, text) {
    text = util.convertLowerUppercase(text, _convertMode);
    $(`#${elementId} .text-container span`).text(text);
}

async function getMetadataConfig() {
    let metadata = await dataService.getMetadata();
    _convertMode = metadata.textConfig.convertMode;
}

function getActionsOfType(elem, type) {
    if (!elem) {
        return [];
    }
    return elem.actions.filter(action => action.modelName === type);
}

function hasNextWordFormAction(elem) {
    return getActionsOfType(elem, GridActionWordForm.getModelName()).some(
        (a) => a.type === GridActionWordForm.WORDFORM_MODE_NEXT_FORM
    );
}

$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);
$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);

export { stateService };

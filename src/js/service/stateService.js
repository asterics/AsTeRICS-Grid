import $ from '../externals/jquery.js';
import { i18nService } from './i18nService.js';
import {GridElement} from "../model/GridElement.js";
import {constants} from "../util/constants.js";
import {util} from "../util/util.js";
import {speechService} from "./speechService.js";
import {dataService} from "./data/dataService.js";

let stateService = {};
let _states = {};
let _listeners = {};
let _currentGrid = null;
let _currentGlobalGrid = null;
let _currentWordFormTags = [];
let _currentWordFormIds = {}; //elementId -> id of word form list (for current lang!)
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

stateService.resetWordFormTags = function () {
    _currentWordFormTags = [];
    _currentWordFormIds = {};
    stateService.applyWordFormsToUI();
};

stateService.resetWordFormIds = function () {
    _currentWordFormIds = {};
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
        let langForms = getWordFormsForLang(element, options.lang);
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

stateService.getBaseForm = function (element, lang) {
    let object = stateService.getBaseFormObject(element, lang);
    return object ? object.value : null;
};

stateService.getBaseFormObject = function (element, lang) {
    lang = lang || i18nService.getContentLang();
    let baseForm = element.wordForms.filter(
        (f) =>
            (!f.lang || f.lang === lang) &&
            (f.tags.length === 0 || (f.tags.length === 1 && f.tags[0] === constants.WORDFORM_TAG_BASE))
    )[0];
    return baseForm ? baseForm : null;
}

stateService.getDisplayText = function (elementId) {
    let element = getElement(elementId);
    if (!element) {
        return '';
    }
    return stateService.getWordForm(element, {searchTags: _currentWordFormTags, searchSubTags: true}) || stateService.getBaseForm(element) || i18nService.getTranslation(element.label);
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
    let baseForm = stateService.getBaseFormObject(element, options.lang) || {};
    return (
        baseForm.pronunciation ||
        baseForm.value ||
        i18nService.getTranslation(element.label, {forceLang: options.lang}) ||
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
    let currentLangForms = getWordFormsForLang(element);
    let currentWordFormObject = this.getWordFormObject(element, {searchTags: _currentWordFormTags, searchSubTags: true}) || {};
    let index = currentLangForms.indexOf(currentWordFormObject);
    index = index >= 0 ? index : null;
    let currentId = _currentWordFormIds[element.id] || index || 0;
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
    text = util.convertLowerUppercase(text, _convertMode);
    $(`#${elementId} .text-container span`).text(text);
}

function getWordFormsForLang(element, lang) {
    lang = lang || i18nService.getContentLang();
    return element.wordForms.filter((form) => !form.lang || form.lang === lang);
}

async function getMetadataConfig() {
    let metadata = await dataService.getMetadata();
    _convertMode = metadata.textConfig.convertMode;
}

$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);
$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);

export { stateService };

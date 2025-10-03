import $ from '../externals/jquery.js';
import Predictionary from 'predictionary';
import { GridElement } from '../model/GridElement';
import { Dictionary } from '../model/Dictionary';
import { dataService } from './data/dataService';
import { constants } from '../util/constants';
import { localStorageService } from './data/localStorageService.js';
import { i18nService } from './i18nService.js';
import { util } from '../util/util.js';
import { GridActionPredict } from '../model/GridActionPredict';
import { utteranceLoggingService } from './utteranceLoggingService.js';

let predictionService = {};
let predictionary = null;
let registeredPredictElements = [];
let _dbDictObjects = [];
let _unsavedChanges = false;
let _usedKeys = [];
let _autosaveInterval = 10 * 60 * 1000; // 10 Minutes
let _intervalHandler = null;
let _currentInitUser = null;
let _textConvertMode = null;
let _lastAppliedPrediction = null;
let _currentValues = {}; // id => prediction

predictionService.predict = function (input, dictionaryKey, options = {}) {
    if (input === undefined || registeredPredictElements.length === 0 || !predictionary) {
        return;
    }
    if (dictionaryKey === GridActionPredict.USE_DICTIONARY_CURRENT_LANG) {
        let langDicts = _dbDictObjects.filter(dict => dict.lang === i18nService.getContentLang());
        let keys = langDicts.map(dict => dict.dictionaryKey);
        predictionary.useDictionaries(keys);
        _usedKeys = keys;
    } else if (!dictionaryKey) {
        predictionary.useAllDictionaries();
        _usedKeys = predictionary.getDictionaryKeys();
    } else {
        predictionary.useDictionary(dictionaryKey);
        if (_usedKeys.indexOf(dictionaryKey) === -1) {
            _usedKeys.push(dictionaryKey);
        }
    }

    let suggestions = predictionary.predict(input, { maxPredicitons: registeredPredictElements.length });

    // Enhance predictions with utterance history if enabled and available
    if (options.useUtteranceHistory !== false && utteranceLoggingService.isEnabled()) {
        suggestions = enhancePredictionsWithHistory(input, suggestions, registeredPredictElements.length);
    }

    if(suggestions.length === 0) {
        suggestions = predictionary.predict("", { maxPredicitons: registeredPredictElements.length });

        // Try utterance history for empty input as well
        if (options.useUtteranceHistory !== false && utteranceLoggingService.isEnabled()) {
            suggestions = enhancePredictionsWithHistory("", suggestions, registeredPredictElements.length);
        }
    }

    for (let i = 0; i < registeredPredictElements.length; i++) {
        let text = suggestions[i] ? suggestions[i] : '';
        text = util.convertLowerUppercase(text, _textConvertMode);
        $(document).trigger(constants.EVENT_ELEM_TEXT_CHANGED, [registeredPredictElements[i].id, text]);
        _currentValues[registeredPredictElements[i].id] = text;
        $(`#${registeredPredictElements[i].id}`).attr(
            'aria-label',
            `${text}, ${i18nService.t('ELEMENT_TYPE_PREDICTION')}`
        );
    }
};

predictionService.learnFromInput = function (input, dictionaryKey) {
    if (!input || !input.trim() || registeredPredictElements.length === 0 || !predictionary) {
        return;
    }
    _unsavedChanges = predictionary.learnFromInput(input, dictionaryKey) || _unsavedChanges;
};

predictionService.initWithElements = async function (elements) {
    registeredPredictElements = [];
    _currentValues = {};
    elements.forEach((element) => {
        if (element && element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
            registeredPredictElements.push(JSON.parse(JSON.stringify(element)));
        }
    });
    registeredPredictElements = registeredPredictElements.sort((a, b) => {
        if (a.y !== b.y) return a.y < b.y ? -1 : 1;
        if (a.x !== b.x) return a.x < b.x ? -1 : 1;
        return 0;
    });
    if (registeredPredictElements.length > 0) {
        await predictionService.initIfNewUser();
    }
    saveDictionaries();
};

predictionService.applyPrediction = function (input, prediction, dictionaryKey) {
    if (registeredPredictElements.length === 0 || !predictionary) {
        return;
    }
    _unsavedChanges = true;
    _lastAppliedPrediction = prediction;
    return predictionary.applyPrediction(input, prediction, { addToDictionary: dictionaryKey });
};

predictionService.getLastAppliedPrediction = function() {
    return _lastAppliedPrediction;
}

predictionService.doAction = function (elementId) {
    if (!predictionary) {
        return;
    }
    let element = registeredPredictElements.filter((element) => element.id === elementId)[0];
    if (element) {
        let word = $(`#${element.id} .text-container > span`).text();
        predictionary.learn(word);
        _unsavedChanges = true;
    }
};

predictionService.getDictionaryKeys = function () {
    return predictionary ? predictionary.getDictionaryKeys() : [];
};

predictionService.init = async function () {
    log.debug('init prediction service');
    _currentInitUser = localStorageService.getAutologinUser() || localStorageService.getLastActiveUser();
    clearInterval(_intervalHandler);
    _unsavedChanges = false;
    predictionary = Predictionary.instance();

    return dataService.getDictionaries().then((dicts) => {
        _dbDictObjects = dicts;
        dicts.forEach((dict) => {
            predictionary.loadDictionary(dict.data, dict.dictionaryKey);
        });
        _intervalHandler = setInterval(saveDictionaries, _autosaveInterval);
        return Promise.resolve();
    });
};

predictionService.initIfNewUser = async function () {
    let currentUser = localStorageService.getAutologinUser() || localStorageService.getLastActiveUser();
    if (_currentInitUser === currentUser) {
        return;
    }
    await predictionService.init();
};

predictionService.stopAutosave = function () {
    clearInterval(_intervalHandler);
};

predictionService.getCurrentValue = function(elementId) {
    return _currentValues[elementId];
}

function saveDictionaries() {
    if (!_unsavedChanges || !predictionary) {
        return;
    }
    _unsavedChanges = false;
    _usedKeys.forEach((key) => {
        let dbDict =
            _dbDictObjects.filter((el) => el.dictionaryKey === key)[0] || new Dictionary({ dictionaryKey: key });
        dbDict.data = predictionary.dictionaryToJSON(key);
        dataService.saveDictionary(dbDict);
    });
}

$(document).on(constants.EVENT_DB_PULL_UPDATED, (event, updatedIds, updatedDocs) => {
    let modelNames = updatedDocs.map((doc) => doc.modelName);
    if (modelNames.indexOf(Dictionary.getModelName()) > -1) {
        predictionService.init();
    }
});

$(document).on(constants.EVENT_USER_CHANGING, () => {
    predictionService.stopAutosave();
});

async function getMetadataConfig() {
    let metadata = await dataService.getMetadata();
    _textConvertMode = metadata.textConfig.convertMode;
}

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);
$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);

/**
 * Enhances dictionary-based predictions with utterance history
 * @param {string} input - Current input text
 * @param {Array} dictionaryPredictions - Predictions from dictionary
 * @param {number} maxPredictions - Maximum number of predictions to return
 * @returns {Array} Enhanced predictions combining dictionary and history
 */
function enhancePredictionsWithHistory(input, dictionaryPredictions, maxPredictions) {
    try {
        const currentLang = i18nService.getContentLang();
        const historySuggestions = utteranceLoggingService.getPredictionSuggestions(
            input,
            currentLang,
            Math.max(3, Math.floor(maxPredictions / 2)) // Use up to half slots for history
        );

        // Convert history suggestions to simple strings
        const historyTexts = historySuggestions.map(s => s.text);

        // Combine dictionary predictions with history suggestions
        // Prioritize dictionary predictions but intersperse with history
        const combined = [];
        const maxDict = Math.ceil(maxPredictions * 0.7); // 70% dictionary
        const maxHistory = maxPredictions - maxDict; // 30% history

        // Add dictionary predictions first
        for (let i = 0; i < Math.min(dictionaryPredictions.length, maxDict); i++) {
            if (dictionaryPredictions[i] && !combined.includes(dictionaryPredictions[i])) {
                combined.push(dictionaryPredictions[i]);
            }
        }

        // Fill remaining slots with history suggestions
        for (let i = 0; i < historyTexts.length && combined.length < maxPredictions; i++) {
            if (historyTexts[i] && !combined.includes(historyTexts[i])) {
                combined.push(historyTexts[i]);
            }
        }

        // If we still have slots, add remaining dictionary predictions
        for (let i = maxDict; i < dictionaryPredictions.length && combined.length < maxPredictions; i++) {
            if (dictionaryPredictions[i] && !combined.includes(dictionaryPredictions[i])) {
                combined.push(dictionaryPredictions[i]);
            }
        }

        return combined;
    } catch (error) {
        log.warn('Error enhancing predictions with history:', error);
        return dictionaryPredictions; // Fallback to dictionary predictions only
    }
}

export { predictionService };

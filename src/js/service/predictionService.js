import Predictionary from 'predictionary'
import {GridElement} from "../model/GridElement";
import {Dictionary} from "../model/Dictionary";
import {fontUtil} from "../util/fontUtil";
import {dataService} from "./data/dataService";

let predictionService = {};
let predictionary = null;
let registeredPredictElements = [];
let _dbDictObjects = [];
let _unsavedChanges = false;
let _usedKeys = [];

predictionService.predict = function (input, dictionaryKey) {
    initIfUnititialized();
    if (!dictionaryKey) {
        predictionary.useAllDictionaries();
        _usedKeys = predictionary.getDictionaryKeys();
    } else {
        predictionary.useDictionary(dictionaryKey);
        if (_usedKeys.indexOf(dictionaryKey) === -1) {
            _usedKeys.push(dictionaryKey);
        }
    }
    let suggestions = predictionary.predict(input, {maxPredicitons: registeredPredictElements.length});
    for (let i = 0; i < registeredPredictElements.length; i++) {
        $(`#${registeredPredictElements[i].id} .text-container span`).text(suggestions[i] ? suggestions[i] : '');
    }
    fontUtil.adaptFontSize($('.item[data-type="ELEMENT_TYPE_PREDICTION"]'));
};

predictionService.learnFromInput = function (input) {
    if (!input || !input.trim()) {
        return;
    }
    initIfUnititialized();
    _unsavedChanges = predictionary.learnFromInput(input) || _unsavedChanges;
};

predictionService.initWithElements = function (elements) {
    initIfUnititialized();
    registeredPredictElements = [];
    elements.forEach(element => {
        if (element && element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
            registeredPredictElements.push(JSON.parse(JSON.stringify(element)));
        }
    });
    registeredPredictElements = registeredPredictElements.sort((a, b) => {
        if (a.y !== b.y) return a.y < b.y ? -1 : 1;
        if (a.x !== b.x) return a.x < b.x ? -1 : 1;
        return 0;
    });
    saveDictionaries();
};

predictionService.applyPrediction = function (input, prediction) {
    initIfUnititialized();
    _unsavedChanges = true;
    return predictionary.applyPrediction(input, prediction);
};

predictionService.doAction = function (elementId) {
    initIfUnititialized();
    let element = registeredPredictElements.filter(element => element.id === elementId)[0];
    if (element) {
        let word = $(`#${element.id} .text-container span`).text();
        predictionary.learn(word);
        _unsavedChanges = true;
    }
};

predictionService.reset = function () {
    predictionary = null;
    _dbDictObjects = null;
};

predictionService.getDictionaryKeys = function () {
    return predictionary.getDictionaryKeys();
};

function initIfUnititialized() {
    if (!predictionary) {
        registeredPredictElements = [];
        predictionary = Predictionary.instance();

        dataService.getDictionaries().then(dicts => {
            _dbDictObjects = dicts;
            dicts.forEach(dict => {
                predictionary.loadDictionary(dict.data, dict.dictionaryKey);
            });
        });
    }
}

function saveDictionaries() {
    if (!_unsavedChanges) {
        return;
    }
    _unsavedChanges = false;
    _usedKeys.forEach(key => {
        let dbDict = _dbDictObjects.filter(el => el.dictionaryKey === key)[0] || new Dictionary({dictionaryKey: key});
        dbDict.data = predictionary.dictionaryToJSON(key);
        dataService.saveDictionary(dbDict);
    });
}

export {predictionService};
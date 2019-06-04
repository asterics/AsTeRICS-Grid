import Predictionary from 'predictionary'
import {GridElement} from "../model/GridElement";
import {speechService} from "./speechService";
import {fontUtil} from "../util/fontUtil";
import {dataService} from "./data/dataService";

let predictionService = {};
let predictionary = null;
let registeredPredictElements = [];
let _dbDictObjects = [];

predictionService.predict = function (input, dictionaryKey) {
    initIfUnititialized();
    if (!dictionaryKey) {
        predictionary.useAllDictionaries();
    } else {
        predictionary.useDictionary(dictionaryKey);
    }
    let suggestions = predictionary.predict(input, {maxPredicitons: registeredPredictElements.length});
    for (let i = 0; i < registeredPredictElements.length; i++) {
        $(`#${registeredPredictElements[i].id} .text-container span`).text(suggestions[i] ? suggestions[i] : '');
    }
    fontUtil.adaptFontSize($('.item[data-type="ELEMENT_TYPE_PREDICTION"]'));
};

predictionService.initWithElements = function (elements) {
    predictionService.init();
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
};

predictionService.applyPrediction = function (input, prediction) {
    initIfUnititialized();
    return predictionary.applyPrediction(input, prediction);
};

predictionService.doAction = function (elementId) {
    initIfUnititialized();
    let element = registeredPredictElements.filter(element => element.id === elementId)[0];
    if (element) {
        let word = $(`#${element.id} .text-container span`).text();
        predictionary.learn(word);
        speechService.speak(word);
    }
};

predictionService.init = function () {
    registeredPredictElements = [];
    predictionary = Predictionary.instance();

    dataService.getDictionaries().then(dicts => {
        _dbDictObjects = dicts;
        dicts.forEach(dict => {
            predictionary.loadDictionary(dict.data, dict.dictionaryKey);
        });
    });
    // TODO implement predictionary.onChange
    /*
    predictionary.onChange = function (changedDictionaryKey) {
        let dbDict = _dbDictObjects.filter(el => el.dictionaryKey === changedDictionaryKey)[0] || new Dictionary({dictionaryKey: changedDictionaryKey});
        dbDict.data = predictionary.dictionaryToJSON(changedDictionaryKey);
        dataService.saveDictionary(dbDict);
    }
    */
};

predictionService.reset = function() {
    predictionary = null;
    _dbDictObjects = null;
};

predictionService.getDictionaryKeys = function () {
    return predictionary.getDictionaryKeys();
};

function initIfUnititialized() {
    if (!predictionary) {
        predictionService.init();
    }
}

export {predictionService};
import Predictionary from 'predictionary'
import {GridElement} from "../model/GridElement";
import {speechService} from "./speechService";
import {fontUtil} from "../util/fontUtil";
import {dataService} from "./data/dataService";

let predictionService = {};
let predictionary = null;
let registeredPredictElements = [];
let _dbDictObjects = [];

predictionService.predict = function (input, dictionaryKeys) {
    initIfUnititialized();
    let suggestions = predictionary.predict(input);
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

    //TODO remove
    let fruits = ['Apple', 'Apricot', 'Avocado', 'Banana', 'Bilberry', 'Blackberry', 'Blackcurrant', 'Blueberry', 'Boysenberry', 'Currant', 'Cherry', 'Cherimoya', 'Cloudberry', 'Coconut', 'Cranberry', 'Cucumber', 'Damson', 'Date', 'Dragonfruit', 'Durian', 'Elderberry', 'Feijoa', 'Fig', 'Goji', 'Gooseberry', 'GrapeRaisin', 'Grapefruit', 'Guava', 'Honeyberry', 'Huckleberry', 'Jabuticaba', 'Jackfruit', 'Jambul', 'Jujube', 'Kiwifruit', 'Kumquat', 'Lemon', 'Lime', 'Loquat', 'Longan', 'Lychee', 'Mango', 'Marionberry', 'Melon', 'Cantaloupe', 'Watermelon', 'Mulberry', 'Nectarine', 'Nance', 'Olive', 'Orange', 'Clementine', 'Mandarine', 'Tangerine', 'Papaya', 'Passionfruit', 'Peach', 'Pear', 'Persimmon', 'Physalis', 'Plantain', 'Pineapple', 'Pomegranate', 'Pomelo', 'Quince', 'Raspberry', 'Salmonberry', 'Rambutan', 'Redcurrant', 'Salak', 'Satsuma', 'Soursop', 'Strawberry', 'Tamarillo', 'Tamarind', 'Yuzu'];
    let verbs = ['ask', 'be', 'become', 'begin', 'call', 'can', 'come', 'could', 'do', 'feel', 'find', 'get', 'give', 'go', 'have', 'hear', 'help', 'keep', 'know', 'leave', 'let', 'like', 'live', 'look', 'make', 'may', 'mean', 'might', 'move', 'need', 'play', 'put', 'run', 'say', 'see', 'seem', 'should', 'show', 'start', 'take', 'talk', 'tell', 'think', 'try', 'turn', 'use', 'want', 'will', 'work', 'would'];
    predictionary.addWords(fruits);
    predictionary.addWords(verbs);

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

predictionService.getDictionaryKeys = function () {
    return predictionary.getDictionaryKeys();
};

function initIfUnititialized() {
    if (!predictionary) {
        predictionService.init();
    }
}

export {predictionService};
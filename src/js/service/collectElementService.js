import {GridElement} from "../model/GridElement";
import {speechService} from "./speechService";
import {constants} from "./../util/constants";
import {translateService} from "./translateService";
import {predictionService} from "./predictionService";
import {fontUtil} from "../util/fontUtil";

var collectElementService = {};

var registeredCollectElements = [];
var collectedTexts = {};

collectElementService.initWithElements = function (elements) {
    collectElementService.reset();
    elements.forEach(element => {
        if (element && element.type == GridElement.ELEMENT_TYPE_COLLECT) {
            registeredCollectElements.push(JSON.parse(JSON.stringify(element)));
        }
    });
};

collectElementService.doAction = function (elem) {
    let collectElem = getCollectElem(elem.id);
    let collectedText = getText(elem.id);
    if (getActionOfType(elem, 'GridActionPredict')) {
        predictionService.predict(collectedText);
    }
    speechService.speak(collectedText, translateService.getLang());
};

collectElementService.reset = function () {
    registeredCollectElements = [];
    collectedTexts = {};
};

function getActionOfType(elem, type) {
    if (!elem) {
        return null;
    }
    let index = elem.actions.map(action => action.modelName).indexOf(type);
    if (index === -1) {
        return null;
    }
    return elem.actions[index];
}

function addText(elemId, text) {
    collectedTexts[elemId] = collectedTexts[elemId] || '';
    if (text.length > 1 && collectedTexts[elemId]) {
        collectedTexts[elemId] += ' ' + text;
    } else {
        collectedTexts[elemId] += text;
    }
}

function getText(elemId) {
    return collectedTexts[elemId] || '';
}

function getCollectElem(elemId) {
    return registeredCollectElements.filter(el => el.id == elemId)[0];
}

$(window).on(constants.ELEMENT_EVENT_ID, function (event, element) {
    if (!element.type || element.type === GridElement.ELEMENT_TYPE_NORMAL) {
        registeredCollectElements.forEach(collectElem => {
            addText(collectElem.id, element.label);
            let text = getText(collectElem.id);
            $(`#${collectElem.id} span`).text(text);
            let predictAction = getActionOfType(collectElem, 'GridActionPredict');
            if (predictAction && predictAction.suggestOnChange) {
                predictionService.predict(text);
            }
        });
    }
    if (!element.type || element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
        registeredCollectElements.forEach(collectElem => {
            let word = $(`#${element.id} .text-container span`).text();
            if (word) {
                let appliedText = predictionService.applyPrediction(collectedTexts[collectElem.id] || '', word);
                collectedTexts[collectElem.id] = appliedText;
                $(`#${collectElem.id} span`).text(getText(collectElem.id));
                let predictAction = getActionOfType(collectElem, 'GridActionPredict');
                if (predictAction && predictAction.suggestOnChange) {
                    predictionService.predict(appliedText);
                }
            }
        });
    }
    fontUtil.adaptFontSize($('.item[data-type="ELEMENT_TYPE_COLLECT"]'));
});

export {collectElementService};
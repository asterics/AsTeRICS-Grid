import {GridElement} from "../model/GridElement";
import {speechService} from "./speechService";
import {constants} from "./../util/constants";
import {util} from "./../util/util";
import {predictionService} from "./predictionService";
import {i18nService} from "./i18nService";
import {fontUtil} from "../util/fontUtil";
import {GridActionCollectElement} from "../model/GridActionCollectElement";

var collectElementService = {};

var registeredCollectElements = [];
var collectedText = '';

collectElementService.initWithElements = function (elements) {
    collectElementService.reset();
    elements.forEach(element => {
        if (element && element.type == GridElement.ELEMENT_TYPE_COLLECT) {
            registeredCollectElements.push(JSON.parse(JSON.stringify(element)));
        }
    });
};

collectElementService.doAction = function (elem) {
    if (getActionOfType(elem, 'GridActionPredict')) {
        predictionService.predict(collectedText);
    }
    speechService.speak(collectedText, i18nService.getLang());
};

collectElementService.reset = function () {
    registeredCollectElements = [];
    collectedText = '';
};

collectElementService.doCollectElementActions = function (action) {
    if (!action) {
        return;
    }
    switch (action) {
        case GridActionCollectElement.COLLECT_ACTION_CLEAR:
            setText('');
            break;
        case GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD:
            let words = collectedText.trim().split(' ');
            words.pop();
            let text = words.join(' ');
            setText(text === '' ? '' : text + ' ');
            break;
        case GridActionCollectElement.COLLECT_ACTION_REMOVE_CHAR:
            setText(collectedText.substring(0, collectedText.length - 1));
            break;
        case GridActionCollectElement.COLLECT_ACTION_COPY_CLIPBOARD:
            util.copyToClipboard(collectedText);
            break;
        case GridActionCollectElement.COLLECT_ACTION_APPEND_CLIPBOARD:
            util.appendToClipboard(collectedText);
            break;
        case GridActionCollectElement.COLLECT_ACTION_CLEAR_CLIPBOARD:
            util.copyToClipboard('');
            break;
    }
    predictionService.predict(collectedText);
};

function setText(text) {
    text = text === undefined ? collectedText : text;
    collectedText = text;
    predictionService.learnFromInput(collectedText);
    $('.item[data-type="ELEMENT_TYPE_COLLECT"] span').text(collectedText);
}

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

function addText(text) {
    setText(collectedText + text);
}

$(window).on(constants.ELEMENT_EVENT_ID, function (event, element) {
    if (registeredCollectElements.length === 0) {
        return;
    }
    if (getActionOfType(element, GridActionCollectElement.getModelName())) {
        return; // no adding of text if the element contains actions for collect elements, e.g. "clear"
    }
    if (!element.type || element.type === GridElement.ELEMENT_TYPE_NORMAL) {
        addText(element.label);
        registeredCollectElements.forEach(collectElem => {
            let predictAction = getActionOfType(collectElem, 'GridActionPredict');
            if (predictAction && predictAction.suggestOnChange) {
                predictionService.predict(collectedText);
            }
        });
    }
    if (element.type && element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
        let word = $(`#${element.id} .text-container span`).text();
        if (word) {
            let appliedText = predictionService.applyPrediction(collectedText || '', word);
            setText(appliedText);
            registeredCollectElements.forEach(collectElem => {
                let predictAction = getActionOfType(collectElem, 'GridActionPredict');
                if (predictAction && predictAction.suggestOnChange) {
                    predictionService.predict(collectedText);
                }
            });
        }
    }
    fontUtil.adaptFontSize($('.item[data-type="ELEMENT_TYPE_COLLECT"]'));
});

export {collectElementService};
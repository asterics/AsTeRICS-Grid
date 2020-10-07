import {GridElement} from "../model/GridElement";
import {speechService} from "./speechService";
import {constants} from "./../util/constants";
import {util} from "./../util/util";
import {predictionService} from "./predictionService";
import {i18nService} from "./i18nService";
import {fontUtil} from "../util/fontUtil";
import {GridActionCollectElement} from "../model/GridActionCollectElement";
import {GridActionNavigate} from "../model/GridActionNavigate";
import {GridActionSpeak} from "../model/GridActionSpeak";
import {GridActionPredict} from "../model/GridActionPredict";
import {youtubeService} from "./youtubeService";
import {GridActionYoutube} from "../model/GridActionYoutube";

var collectElementService = {};

var registeredCollectElements = [];
var collectedText = '';
let keyboardLikeFactor = 0;
let dictionaryKey = null;

collectElementService.initWithElements = function (elements, dontAutoPredict) {
    registeredCollectElements = [];
    let oneCharacterElements = 0;
    let normalElements = 0;
    dictionaryKey = null;
    elements.forEach(element => {
        if (element && element.type === GridElement.ELEMENT_TYPE_NORMAL) {
            normalElements++;
            let label = i18nService.getTranslation(element.label);
            if (label && label.length === 1) {
                oneCharacterElements++;
            }
        }
        if (element && element.type === GridElement.ELEMENT_TYPE_COLLECT) {
            let copy = JSON.parse(JSON.stringify(element));
            dictionaryKey = dictionaryKey || copy.actions.reduce((total, action) => {
                let dictKey = GridActionPredict.getModelName() ? action.dictionaryKey : null;
                return total || dictKey;
            }, null);
            registeredCollectElements.push(copy);
        }
    });
    keyboardLikeFactor = oneCharacterElements / normalElements;
    if (registeredCollectElements.length > 0) {
        let intervalHandler = setInterval(() => {
            if ($('.item[data-type="ELEMENT_TYPE_COLLECT"]').length > 0) {
                clearInterval(intervalHandler);
                setText();
                if (!dontAutoPredict) {
                    predictionService.predict(collectedText, dictionaryKey);
                }
            }
        }, 100);
    }
};

collectElementService.doAction = function (elem) {
    if (getActionOfType(elem, 'GridActionPredict')) {
        predictionService.predict(collectedText, dictionaryKey);
    }
    let speakAction = elem.actions.filter(a => a.modelName === GridActionSpeak.getModelName())[0];
    let language = speakAction && speakAction.speakLanguage ? speakAction.speakLanguage : i18nService.getBrowserLang();
    speechService.speak(collectedText, language);
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
        case GridActionCollectElement.COLLECT_ACTION_TO_YOUTUBE:
            youtubeService.setActionAfterNavigate(new GridActionYoutube({
                action: GridActionYoutube.actions.YT_PLAY,
                playType: GridActionYoutube.playTypes.YT_PLAY_SEARCH,
                data: collectedText
            }));
            break;
    }
    predictionService.predict(collectedText, dictionaryKey);
};

function setText(text) {
    text = text === undefined ? collectedText : text;
    collectedText = text;
    predictionService.learnFromInput(collectedText, dictionaryKey);
    $('.item[data-type="ELEMENT_TYPE_COLLECT"] .collect-text').text(collectedText);
    fontUtil.adaptFontSize($('.item[data-type="ELEMENT_TYPE_COLLECT"]'));
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
    if (getActionOfType(element, GridActionNavigate.getModelName())) {
        return; // no adding of text if the element contains an navigate action
    }
    if (!element.type || element.type === GridElement.ELEMENT_TYPE_NORMAL) {
        if (!i18nService.getTranslation(element.label)) {
            return;
        }
        let label = i18nService.getTranslation(element.label);
        let textToAdd = label.length === 1 && keyboardLikeFactor > 0.5 ? label.toLowerCase() : label + ' ';
        addText(textToAdd);
        registeredCollectElements.forEach(collectElem => {
            let predictAction = getActionOfType(collectElem, 'GridActionPredict');
            if (predictAction && predictAction.suggestOnChange) {
                predictionService.predict(collectedText, dictionaryKey);
            }
        });
    }
    if (element.type && element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
        let word = $(`#${element.id} .text-container span`).text();
        if (word) {
            let appliedText = predictionService.applyPrediction(collectedText || '', word, dictionaryKey);
            setText(appliedText);
            registeredCollectElements.forEach(collectElem => {
                let predictAction = getActionOfType(collectElem, 'GridActionPredict');
                if (predictAction && predictAction.suggestOnChange) {
                    predictionService.predict(collectedText, dictionaryKey);
                }
            });
        }
    }
});

export {collectElementService};
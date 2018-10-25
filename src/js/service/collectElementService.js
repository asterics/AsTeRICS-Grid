import {GridElement} from "../model/GridElement";
import {speechService} from "./speechService";
import {constants} from "./../util/constants";
import {translateService} from "./translateService";

var collectElementService = {};

var registeredCollectElements = [];
var collectedTexts = {};

collectElementService.initWithElements = function (elements) {
    collectElementService.reset();
    elements.forEach(element => {
        if(element && element.type == GridElement.ELEMENT_TYPE_COLLECT) {
            registeredCollectElements.push(JSON.parse(JSON.stringify(element)));
        }
    });
};

collectElementService.doAction = function (collectElemId) {
    var collectElem = getCollectElem(collectElemId);
    var collectedText = getText(collectElemId);
    speechService.speak(collectedText, translateService.getLang());
};

collectElementService.reset = function () {
    registeredCollectElements = [];
    collectedTexts = {};
};

function addText(elemId, text) {
    collectedTexts[elemId] = collectedTexts[elemId] || '';
    if(text.length > 1 && collectedTexts[elemId]) {
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

$(window).on(constants.ELEMENT_EVENT_ID, function(event, element) {
    if(!element.type || element.type == GridElement.ELEMENT_TYPE_NORMAL) {
        registeredCollectElements.forEach(collectElem => {
            addText(collectElem.id, element.label);
            $(`#${collectElem.id} textarea`)[0].value = getText(collectElem.id);
        });
    }
});

export {collectElementService};
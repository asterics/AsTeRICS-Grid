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
import {imageUtil} from "../util/imageUtil.js";

let collectElementService = {};

let registeredCollectElements = [];
let collectedText = '';
let collectedImages = [];
let collectedImageLabels = [];
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
        if (element && [GridElement.ELEMENT_TYPE_COLLECT, GridElement.ELEMENT_TYPE_COLLECT_IMAGE].includes(element.type)) {
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
            if ($('.item[data-type="ELEMENT_TYPE_COLLECT"], .item[data-type="ELEMENT_TYPE_COLLECT_IMAGE"]').length > 0) {
                clearInterval(intervalHandler);
                updateCollectElements();
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
    let language = speakAction && speakAction.speakLanguage ? speakAction.speakLanguage : i18nService.getCurrentLang();
    speechService.speak(collectedText, language);
};

collectElementService.doCollectElementActions = function (action) {
    if (!action) {
        return;
    }
    switch (action) {
        case GridActionCollectElement.COLLECT_ACTION_CLEAR:
            setText('');
            clearImages();
            break;
        case GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD:
            let words = collectedText.trim().split(' ');
            words.pop();
            let text = words.join(' ');
            setText(text === '' ? '' : text + ' ');
            removeImage();
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
    updateCollectElements(GridElement.ELEMENT_TYPE_COLLECT);
}

function removeImage() {
    collectedImages.pop();
    collectedImageLabels.pop();;
    updateCollectElements(GridElement.ELEMENT_TYPE_COLLECT_IMAGE);
}

function clearImages() {
    collectedImages = [];
    collectedImageLabels = [];
    updateCollectElements(GridElement.ELEMENT_TYPE_COLLECT_IMAGE);
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

async function updateCollectElements(type) {
    for (let collectElement of registeredCollectElements) {
        if (!type || collectElement.type === type) {
            if (collectElement.type === GridElement.ELEMENT_TYPE_COLLECT) {
                predictionService.learnFromInput(collectedText, dictionaryKey);
                $(`#${collectElement.id} .collect-text`).text(collectedText);
                fontUtil.adaptFontSize($(`#${collectElement.id}`));
            } else if (collectElement.type === GridElement.ELEMENT_TYPE_COLLECT_IMAGE) {
                let html = '';
                let height = $(`#${collectElement.id} .collect-images`).height();
                let width = $(`#${collectElement.id} .collect-images`).width();
                let imgMargin = width < 400 ? 1 : width < 700 ? 2 : 5;
                let showLabel = collectElement.showLabels;
                let textPercentage = 0.85; // precentage of text height compared to text-line height
                let imagePercentage = collectElement.imageHeightPercentage / 100; // percentage of total height used for image
                let imageCount = collectedImages.length;
                let imgContainerHeight = showLabel ? height * imagePercentage : height;
                let imageRatios = [];
                for (const img of collectedImages) {
                    let dim = await imageUtil.getImageDimensionsFromDataUrl(img);
                    imageRatios.push(dim.ratio);
                }
                let maxImgRatio = Math.max(...imageRatios);
                let maxImages = Math.floor(width / (imgContainerHeight * maxImgRatio));
                let numLines = 1;
                while (maxImages < imageCount) {
                    numLines++;
                    maxImages = Math.floor(width / (imgContainerHeight * maxImgRatio / numLines)) * numLines;
                }
                imgContainerHeight = imgContainerHeight / numLines;
                let imgHeight = imgContainerHeight - imgMargin * 2;
                let lineHeight = (height / numLines - (imgContainerHeight));
                let textHeight = lineHeight * textPercentage;
                for (const [index, image] of collectedImages.entries()) {
                    let label = collectedImageLabels[index];
                    let imgWidth = imgHeight * imageRatios[index];
                    html += `<div style="display: flex; flex:0; justify-content: center; flex-direction: column; margin: ${imgMargin}px; title=${label}">
                                <div style="display:flex; justify-content: center">
                                    <img src="${image}" height="${imgHeight}"/>
                                </div>
                                <div style="text-align: center; font-size: ${textHeight}px; line-height: ${lineHeight}px; height: ${lineHeight}px; width: ${imgWidth}px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; ${!showLabel ? 'display: none' : ''}">
                                    ${label}
                                </div>
                             </div>`
                }
                $(`#${collectElement.id} .collect-images`).html(html);
            }
        }
    }
}

$(window).on(constants.ELEMENT_EVENT_ID, function (event, element) {
    let label = i18nService.getTranslation(element.label);
    let image = element.image ? element.image.data : null;

    if (getActionOfType(element, GridActionCollectElement.getModelName())) {
        return; // no adding of text if the element contains actions for collect elements, e.g. "clear"
    }
    if (getActionOfType(element, GridActionNavigate.getModelName()) && label.length !== 1) {
        return; // no adding of text if the element contains an navigate action and it's no single keyboard character
    }
    if (image) {
        collectedImages.push(image);
        collectedImageLabels.push(label);
        updateCollectElements(GridElement.ELEMENT_TYPE_COLLECT_IMAGE);
    }

    if (label && element.type === GridElement.ELEMENT_TYPE_NORMAL) {
        let textToAdd = label.length === 1 && keyboardLikeFactor > 0.4 ? label.toLowerCase() : label + ' ';
        setText(collectedText + textToAdd);
        triggerPredict();
    }
    if (element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
        let word = $(`#${element.id} .text-container span`).text();
        if (word) {
            let appliedText = predictionService.applyPrediction(collectedText || '', word, dictionaryKey);
            setText(appliedText);
            triggerPredict();
        }
    }
});

function triggerPredict() {
    registeredCollectElements.forEach(collectElement => {
        let predictAction = getActionOfType(collectElement, 'GridActionPredict');
        if (predictAction && predictAction.suggestOnChange) {
            predictionService.predict(collectedText, dictionaryKey);
        }
    });
}

$(window).on(constants.EVENT_GRID_RESIZE, function () {
    setTimeout(updateCollectElements, 500);
});

export {collectElementService};
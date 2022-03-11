import {GridElement} from "../model/GridElement";
import {speechService} from "./speechService";
import {constants} from "./../util/constants";
import {util} from "./../util/util";
import {predictionService} from "./predictionService";
import {i18nService} from "./i18nService";
import {fontUtil} from "../util/fontUtil";
import {GridActionCollectElement} from "../model/GridActionCollectElement";
import {GridActionNavigate} from "../model/GridActionNavigate";
import {GridActionPredict} from "../model/GridActionPredict";
import {youtubeService} from "./youtubeService";
import {GridActionYoutube} from "../model/GridActionYoutube";
import {imageUtil} from "../util/imageUtil.js";
import {GridElementCollect} from "../model/GridElementCollect.js";

let collectElementService = {};

let registeredCollectElements = [];
let collectedText = '';
let collectedImages = [];
let collectedImageLabels = [];
let markedImageIndex = null;
let keyboardLikeFactor = 0;
let dictionaryKey = null;
let autoCollectImage = true;

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
                updateCollectElements();
                if (!dontAutoPredict) {
                    predictionService.predict(collectedText, dictionaryKey);
                }
            }
        }, 100);
    }
};

collectElementService.doCollectElementActions = async function (action) {
    if (!action) {
        return;
    }
    switch (action) {
        case GridActionCollectElement.COLLECT_ACTION_SPEAK:
            if (autoCollectImage) {
                speechService.speakArray(collectedImageLabels, (word, index) => {
                    markedImageIndex = index;
                    updateCollectElements();
                });
            } else {
                speechService.speak(collectedText);
            }
            break;
        case GridActionCollectElement.COLLECT_ACTION_SPEAK_CLEAR:
            if (autoCollectImage) {
                speechService.speakArray(collectedImageLabels, (word, index) => {
                    markedImageIndex = index;
                    updateCollectElements();
                    if (!word) {
                        clearImages();
                    }
                });
            } else {
                speechService.speak(collectedText);
                speechService.doAfterFinishedSpeaking(() => {
                    setText('');
                });
            }
            break;
        case GridActionCollectElement.COLLECT_ACTION_CLEAR:
            setText('');
            clearImages();
            speechService.stopSpeaking();
            break;
        case GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD:
            let words = collectedText.trim().split(' ');
            words.pop();
            let text = words.join(' ');
            setText(text === '' ? '' : text + ' ');
            removeImage();
            speechService.stopSpeaking();
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
    updateCollectElements();
}

function removeImage() {
    collectedImages.pop();
    collectedImageLabels.pop();
    updateCollectElements();
}

function clearImages() {
    collectedImages = [];
    collectedImageLabels = [];
    updateCollectElements();
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

async function updateCollectElements() {
    for (let collectElement of registeredCollectElements) {
        let imageMode = isImageMode(collectElement.mode);
        if (!imageMode) {
            predictionService.learnFromInput(collectedText, dictionaryKey);
            let html = `<span style="padding: 5px; display: flex; align-items: center; flex: 1; text-align: left;">
                            ${collectedText}
                        </span>`;
            $(`#${collectElement.id} .collect-container`).html(html);
            fontUtil.adaptFontSize($(`#${collectElement.id}`));
        } else {
            let html = '';
            let height = $(`#${collectElement.id} .collect-container`).height();
            let width = $(`#${collectElement.id} .collect-container`).width();
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
                let marked = markedImageIndex === index;
                html += `<div style="display: flex; flex:0; justify-content: center; flex-direction: column; padding: ${imgMargin}px; title=${label}; ${marked ? 'background-color: lightgreen;' : ''}">
                                <div style="display:flex; justify-content: center">
                                    <img src="${image}" height="${imgHeight}"/>
                                </div>
                                <div style="text-align: center; font-size: ${textHeight}px; line-height: ${lineHeight}px; height: ${lineHeight}px; width: ${imgWidth}px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; ${!showLabel ? 'display: none' : ''}">
                                    ${label}
                                </div>
                             </div>`
            }
            $(`#${collectElement.id} .collect-container`).html(html);
        }
    }
}

function isImageMode(elementMode) {
    let imageMode = autoCollectImage;
    switch (elementMode) {
        case GridElementCollect.MODE_ONLY_SYMBOLS:
            imageMode = true;
            break;
        case GridElementCollect.MODE_ONLY_TEXT:
            imageMode = false;
            break;
    }
    return imageMode;
}

$(window).on(constants.ELEMENT_EVENT_ID, function (event, element) {
    let label = i18nService.getTranslation(element.label);
    let image = element.image ? element.image.data : null;

    if (element.type === GridElement.ELEMENT_TYPE_COLLECT) {
        return;
    }

    if (getActionOfType(element, GridActionCollectElement.getModelName())) {
        return; // no adding of text if the element contains actions for collect elements, e.g. "clear"
    }
    if (getActionOfType(element, GridActionNavigate.getModelName()) && label.length !== 1) {
        return; // no adding of text if the element contains an navigate action and it's no single keyboard character
    }

    autoCollectImage = !!image;
    if (image) {
        collectedImages.push(image);
        collectedImageLabels.push(label);
    } else if (label && element.type === GridElement.ELEMENT_TYPE_NORMAL) {
        let textToAdd = label.length === 1 && keyboardLikeFactor > 0.4 ? label.toLowerCase() : label + ' ';
        collectedText += textToAdd;
        triggerPredict();
    } else if (element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
        let word = $(`#${element.id} .text-container span`).text();
        if (word) {
            let appliedText = predictionService.applyPrediction(collectedText || '', word, dictionaryKey);
            collectedText = appliedText;
            triggerPredict();
        }
    }
    updateCollectElements();
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
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
import {GridActionSpeak} from "../model/GridActionSpeak.js";
import {GridActionSpeakCustom} from "../model/GridActionSpeakCustom.js";

let collectElementService = {};

let registeredCollectElements = [];
let collectedText = '';
let collectedImages = [];
let collectedImageLabels = [];
let markedImageIndex = null;
let keyboardLikeFactor = 0;
let dictionaryKey = null;
let autoCollectImage = true;
let collectMode = GridElementCollect.MODE_AUTO;
let convertToLowercase = true;

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
            collectMode = copy.mode || collectMode;
            convertToLowercase = copy.convertToLowercase !== false;
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
            if (autoCollectImage || collectMode === GridElementCollect.MODE_COLLECT_SEPARATED) {
                speechService.speakArray(collectedImageLabels, (word, index) => {
                    markedImageIndex = index;
                    updateCollectElements();
                });
            } else {
                speechService.speak(collectedText);
            }
            break;
        case GridActionCollectElement.COLLECT_ACTION_SPEAK_CLEAR:
            if (autoCollectImage || collectMode === GridElementCollect.MODE_COLLECT_SEPARATED) {
                speechService.speakArray(collectedImageLabels, (word, index) => {
                    markedImageIndex = index;
                    updateCollectElements();
                    if (!word) {
                        clearAll();
                    }
                });
            } else {
                speechService.speak(collectedText);
                speechService.doAfterFinishedSpeaking(() => {
                    clearAll();
                });
            }
            break;
        case GridActionCollectElement.COLLECT_ACTION_CLEAR:
            clearAll();
            speechService.stopSpeaking();
            break;
        case GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD:
            collectedImages.pop();
            let removedLabel = collectedImageLabels.pop();
            if (removedLabel) {
                collectedText = collectedText.substring(0, collectedText.toLowerCase().lastIndexOf(removedLabel.toLowerCase()));
            }
            if (autoCollectImage && collectedImages.length === 0) {
                collectedText = '';
            }
            updateCollectElements();
            speechService.stopSpeaking();
            break;
        case GridActionCollectElement.COLLECT_ACTION_REMOVE_CHAR:
            collectedText = collectedText.substring(0, collectedText.length - 1);
            let lastImage = collectedImages[collectedImages.length - 1];
            if (!lastImage && collectedImages.length > 0) {
                collectedImageLabels[collectedImageLabels.length - 1] = collectedImageLabels[collectedImageLabels.length - 1].slice(0, -1);
                if (!collectedImageLabels[collectedImageLabels.length - 1]) {
                    collectedImageLabels.pop();
                    collectedImages.pop();
                }
            } else {
                let removedLabel = collectedImageLabels.pop();
                collectedImages.pop();
                if (removedLabel) {
                    collectedText = collectedText.substring(0, collectedText.toLowerCase().lastIndexOf(removedLabel.toLowerCase()));
                }
            }
            updateCollectElements();
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

function clearAll() {
    collectedImages = [];
    collectedImageLabels = [];
    collectedText = '';
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

function getActionTypes(elem) {
    return elem.actions.map(action => action.modelName);
}

async function updateCollectElements(isSecondTry) {
    autoCollectImage = collectedImages.some(e => !!e);
    for (let collectElement of registeredCollectElements) {
        let imageMode = isImageMode(collectElement.mode);
        let outerContainerJqueryElem = $(`#${collectElement.id} .collect-outer-container`);
        if (!imageMode) {
            predictionService.learnFromInput(collectedText, dictionaryKey);
            let html = `<span style="padding: 5px; display: flex; align-items: center; flex: 1; text-align: left;">
                            ${collectedText}
                        </span>`;
            outerContainerJqueryElem.html(html = `<div class="collect-container" dir="auto" style="flex: 1; background-color: white; text-align: justify;">${html}</div>`);
            fontUtil.adaptFontSize($(`#${collectElement.id}`));
        } else {
            let html = '';
            let height = $(`#${collectElement.id} .collect-container`).prop("clientHeight") || outerContainerJqueryElem.prop("clientHeight"); // consider scrollbar height

            let width = outerContainerJqueryElem.width();
            let imgMargin = width < 400 ? 2 : width < 700 ? 3 : 5;
            let showLabel = collectElement.showLabels;
            let textPercentage = 0.85; // precentage of text height compared to text-line height
            let imagePercentage = collectElement.imageHeightPercentage / 100; // percentage of total height used for image
            let useSingleLine = collectElement.singleLine;
            let imageCount = collectedImages.length;
            let imgContainerHeight = showLabel ? height * imagePercentage : height;
            let imageRatios = [];
            for (const img of collectedImages) {
                let dim = await imageUtil.getImageDimensionsFromDataUrl(img);
                imageRatios.push(dim.ratio);
            }
            let maxImgRatio = Math.max(...imageRatios) || 1;
            let maxImages = Math.floor(width / (imgContainerHeight * maxImgRatio));
            let numLines = 1;
            while (maxImages < imageCount && !useSingleLine) {
                numLines++;
                maxImages = Math.floor(width / (imgContainerHeight * maxImgRatio / numLines)) * numLines;
            }
            imgContainerHeight = imgContainerHeight / numLines;
            let imgHeight = imgContainerHeight - imgMargin * 2;
            let lineHeight = (height / numLines - (imgContainerHeight));
            let textHeight = lineHeight * textPercentage;
            let totalWidth = 0;
            for (const [index, image] of collectedImages.entries()) {
                let label = collectedImageLabels[index];
                let elemWidth = imgHeight * imageRatios[index] || imgHeight;
                let marked = markedImageIndex === index;
                let imgHTML = null;
                if (image) {
                    imgHTML = `<img src="${image}" height="${imgHeight}"/>`;
                    totalWidth += elemWidth + 2 * imgMargin;
                } else {
                    let fontSizeFactor = collectElement.textElemSizeFactor || 1.5;
                    let fontSize = textHeight * fontSizeFactor;
                    elemWidth = fontUtil.getTextWidth(label, outerContainerJqueryElem[0], `${fontSize}px`) + 2 * imgMargin;
                    totalWidth += elemWidth + 4 * imgMargin;
                    imgHTML = `<div style="padding: ${imgMargin}px; font-size: ${fontSize}px; width: ${elemWidth}px; height: ${imgHeight}px; display: flex; justify-content: center; align-items: center; text-align: center;"><span>${label}</span></div>`;
                }
                html += `<div id="collect${index}" style="display: flex; flex:0; justify-content: center; flex-direction: column; padding: ${imgMargin}px; title=${label}; ${marked ? 'background-color: lightgreen;' : ''}">
                                <div style="display:flex; justify-content: center">
                                        ${imgHTML}
                                </div>
                                <div style="text-align: center; font-size: ${textHeight}px; line-height: ${lineHeight}px; height: ${lineHeight}px; width: ${elemWidth}px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; ${!showLabel ? 'display: none' : ''}">
                                    ${image ? label : ''}
                                </div>
                             </div>`
            }
            let additionalCSS = useSingleLine ? 'overflow-x: auto; overflow-y: hidden;' : 'flex-wrap: wrap;';
            html = `<div class="collect-container" dir="auto" style="flex: 1; display: flex; flex-direction: row; background-color: white; text-align: justify; ${additionalCSS}">${html}</div>`;
            outerContainerJqueryElem.html(html);
            if (useSingleLine) {
                let scroll = markedImageIndex !== null ? maxImgRatio * imgHeight * markedImageIndex : maxImgRatio * imgHeight * imageCount;
                $(`#${collectElement.id} .collect-container`).scrollLeft(scroll);
                if (totalWidth > width && !isSecondTry) {
                    updateCollectElements(true); // do second time to adapt to reduced height because of scrollbar
                }
            }
        }
    }
}

function isImageMode(elementMode) {
    let imageMode = autoCollectImage;
    switch (elementMode) {
        case GridElementCollect.MODE_COLLECT_SEPARATED:
            imageMode = true;
            break;
        case GridElementCollect.MODE_COLLECT_TEXT:
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

    let notIgonoreActions = [GridActionSpeak.getModelName(), GridActionSpeakCustom.getModelName(), GridActionNavigate.getModelName()];
    let ignoreActions = GridElement.getActionTypeModelNames().filter(e => !notIgonoreActions.includes(e));
    if (getActionTypes(element).some(type => ignoreActions.includes(type))) {
        return; // dont collect elements containing "ignoreActions"
    }
    let navigateAction = getActionOfType(element, GridActionNavigate.getModelName());
    if (navigateAction && label.length !== 1 && !navigateAction.addToCollectElem) {
        return; // no adding of text if the element contains an navigate action and it's no single keyboard character
    }

    let lastImage = collectedImages.length > 0 ? collectedImages[collectedImages.length - 1] : null;
    if (label && convertToLowercase) {
        label = label.toLowerCase();
    }
    if (label) {
        if (label.length === 1 && collectedImageLabels.length > 0 && !image && !lastImage && !collectedText.endsWith(' ')) {
            let lastElem = collectedImageLabels.pop();
            lastElem += label;
            collectedImageLabels.push(lastElem.trim());
        } else {
            collectedImageLabels.push(label);
            collectedImages.push(image);
        }
    }
    if (label && element.type === GridElement.ELEMENT_TYPE_NORMAL) {
        let textToAdd = label.length === 1 && keyboardLikeFactor > 0.4 ? label : label + ' ';
        collectedText += textToAdd;
        triggerPredict();
    } else if (element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
        let word = $(`#${element.id} .text-container span`).text();
        if (word) {
            let appliedText = predictionService.applyPrediction(collectedText || '', word, dictionaryKey);
            collectedText = appliedText;
            let lastImageLabel = collectedImageLabels.length > 0 ? collectedImageLabels[collectedImageLabels.length - 1] : null;
            if (lastImageLabel && word.toLowerCase().startsWith(lastImageLabel.toLowerCase()) && word.toLowerCase() !== lastImageLabel.toLowerCase()) {
                collectedImageLabels.pop();
                collectedImageLabels.push(word);
            } else {
                collectedImageLabels.push(word);
                collectedImages.push(null);
            }
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
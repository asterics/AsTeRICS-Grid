import $ from '../externals/jquery.js';
import { GridElement } from '../model/GridElement';
import { speechService } from './speechService';
import { constants } from './../util/constants';
import { util } from './../util/util';
import { predictionService } from './predictionService';
import { i18nService } from './i18nService';
import { fontUtil } from '../util/fontUtil';
import { GridActionCollectElement } from '../model/GridActionCollectElement';
import { GridActionNavigate } from '../model/GridActionNavigate';
import { GridActionPredict } from '../model/GridActionPredict';
import { youtubeService } from './youtubeService';
import { GridActionYoutube } from '../model/GridActionYoutube';
import { imageUtil } from '../util/imageUtil.js';
import { GridElementCollect } from '../model/GridElementCollect.js';
import { GridActionSpeak } from '../model/GridActionSpeak.js';
import { GridActionSpeakCustom } from '../model/GridActionSpeakCustom.js';
import { dataService } from './data/dataService.js';
import { GridActionAudio } from '../model/GridActionAudio.js';
import { TextConfig } from '../model/TextConfig.js';
import {arasaacService} from "./pictograms/arasaacService.js";

let collectElementService = {};

let registeredCollectElements = [];
let collectedText = '';
let collectedElements = [];
let markedImageIndex = null;
let keyboardLikeFactor = 0;
let dictionaryKey = null;
let autoCollectImage = true;
let collectMode = GridElementCollect.MODE_AUTO;
let convertToLowercaseIfKeyboard = true;
let convertMode = null;
let activateARASAACGrammarAPI = false;

let duplicatedCollectPause = 0;
let lastCollectId = null;
let lastCollectTime = 0;

collectElementService.initWithElements = function (elements, dontAutoPredict) {
    registeredCollectElements = [];
    let oneCharacterElements = 0;
    let normalElements = 0;
    dictionaryKey = null;
    elements.forEach((element) => {
        if (element && element.type === GridElement.ELEMENT_TYPE_NORMAL) {
            normalElements++;
            let label = i18nService.getTranslation(element.label);
            if (label && label.length === 1) {
                oneCharacterElements++;
            }
        }
        if (element && element.type === GridElement.ELEMENT_TYPE_COLLECT) {
            let copy = JSON.parse(JSON.stringify(element));
            dictionaryKey =
                dictionaryKey ||
                copy.actions.reduce((total, action) => {
                    let dictKey = GridActionPredict.getModelName() ? action.dictionaryKey : null;
                    return total || dictKey;
                }, null);
            collectMode = copy.mode || collectMode;
            convertToLowercaseIfKeyboard = copy.convertToLowercase !== false;
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
    let speakText = getSpeakText();
    let speakArray = getSpeakTextObjectArray();
    if (activateARASAACGrammarAPI && GridActionCollectElement.isSpeakAction(action)) {
        if (autoCollectImage || collectMode === GridElementCollect.MODE_COLLECT_SEPARATED) {
            speakText = await arasaacService.getCorrectGrammar(speakText);
            let changed = applyGrammarCorrection(speakText);
            if (changed) {
                updateCollectElements();
            }
        } else {
            let original = collectedText;
            collectedText = speakText = await arasaacService.getCorrectGrammar(collectedText);
            if (original !== collectedText) {
                updateCollectElements();
            }
        }
        speakArray = getSpeakTextObjectArray(true);
    }
    switch (action) {
        case GridActionCollectElement.COLLECT_ACTION_SPEAK:
            if (autoCollectImage || collectMode === GridElementCollect.MODE_COLLECT_SEPARATED) {
                speechService.speakArray(speakArray, (index) => {
                    markedImageIndex = index;
                    updateCollectElements();
                });
            } else {
                speechService.speak(speakText);
            }
            break;
        case GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS:
            speechService.speak(speakText);
            break;
        case GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR:
            speechService.speak(speakText);
            await speechService.waitForFinishedSpeaking();
            clearAll();
            break;
        case GridActionCollectElement.COLLECT_ACTION_SPEAK_CLEAR:
            if (autoCollectImage || collectMode === GridElementCollect.MODE_COLLECT_SEPARATED) {
                speechService.speakArray(speakArray, (index, finished) => {
                    markedImageIndex = index;
                    updateCollectElements();
                    if (finished) {
                        clearAll();
                    }
                });
            } else {
                speechService.speak(speakText);
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
            let removedElement = collectedElements.pop();
            let removedLabel = getLabel(removedElement);
            if (removedLabel) {
                collectedText = collectedText.substring(
                    0,
                    collectedText.toLowerCase().lastIndexOf(removedLabel.toLowerCase())
                );
            }
            if (autoCollectImage && collectedElements.length === 0) {
                collectedText = '';
            }
            updateCollectElements();
            speechService.stopSpeaking();
            break;
        case GridActionCollectElement.COLLECT_ACTION_REMOVE_CHAR:
            collectedText = collectedText.substring(0, collectedText.length - 1);
            let lastImage = getLastImage();
            if (!lastImage && collectedElements.length > 0) {
                let lastLabel = getLastLabel();
                setLastLabel(lastLabel.substring(0, lastLabel.length - 1));
                if (!getLastLabel()) {
                    collectedElements.pop();
                }
            } else {
                let removedElement = collectedElements.pop();
                let removedLabel = getLabel(removedElement);
                if (removedLabel) {
                    collectedText = collectedText.substring(
                        0,
                        collectedText.toLowerCase().lastIndexOf(removedLabel.toLowerCase())
                    );
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
            youtubeService.setActionAfterNavigate(
                new GridActionYoutube({
                    action: GridActionYoutube.actions.YT_PLAY,
                    playType: GridActionYoutube.playTypes.YT_PLAY_SEARCH,
                    data: collectedText
                })
            );
            break;
    }
    predictionService.predict(collectedText, dictionaryKey);
};

async function applyGrammarCorrection(newText) {
    let changedSomething = false;
    let originalText = getSpeakText();
    if (originalText === newText) {
        return false;
    }
    let originalWords = originalText.split(' ');
    let newWords = newText.split(' ');
    if (originalWords.length !== newWords.length) {
        return false;
    }
    for (let element of collectedElements) {
        let label = element.fixedGrammarText || getSpeakTextOfElement(element).trim().replace(/\s+/g, ' ');
        let wordCount = label.split(' ').length;
        let newLabel = newWords.slice(0, wordCount).join(' ');
        newWords = newWords.slice(wordCount);
        if (newLabel !== label) {
            element.fixedGrammarText = newLabel;
            changedSomething = true;
        }
    }
    return changedSomething;
}

function clearAll() {
    collectedElements = [];
    collectedText = '';
    updateCollectElements();
}

function getActionOfType(elem, type) {
    if (!elem) {
        return null;
    }
    let index = elem.actions.map((action) => action.modelName).indexOf(type);
    if (index === -1) {
        return null;
    }
    return elem.actions[index];
}

function getActionTypes(elem) {
    return elem.actions.map((action) => action.modelName);
}

async function updateCollectElements(isSecondTry) {
    autoCollectImage = collectedElements.some((e) => !!getImage(e));
    let metadata = null;
    if (registeredCollectElements.length > 0) {
        metadata = await dataService.getMetadata();
    }
    for (let collectElement of registeredCollectElements) {
        let txtBackgroundColor = metadata.colorConfig.gridBackgroundColor || '#ffffff';
        let imageMode = isImageMode(collectElement.mode);
        let outerContainerJqueryElem = $(`#${collectElement.id} .collect-outer-container`);
        if (!imageMode) {
            $(`#${collectElement.id}`).attr('aria-label', `${collectedText}, ${i18nService.t('ELEMENT_TYPE_COLLECT')}`);
            predictionService.learnFromInput(collectedText, dictionaryKey);
            let html = `<span style="padding: 5px; display: flex; align-items: center; flex: 1; text-align: left;">
                            ${collectedText}
                        </span>`;
            outerContainerJqueryElem.html(
                (html = `<div class="collect-container" dir="auto" style="flex: 1; background-color: #e8e8e8; text-align: justify;">${html}</div>`)
            );
            fontUtil.adaptFontSize($(`#${collectElement.id}`));
        } else {
            $(`#${collectElement.id}`).attr(
                'aria-label',
                `${collectedElements.map((e) => getLabel(e)).join(' ')}, ${i18nService.t('ELEMENT_TYPE_COLLECT')}`
            );
            let html = '';
            let height =
                $(`#${collectElement.id} .collect-container`).prop('clientHeight') ||
                outerContainerJqueryElem.prop('clientHeight'); // consider scrollbar height

            let width = outerContainerJqueryElem.width();
            let imgMargin = width < 400 ? 2 : width < 700 ? 3 : 5;
            let showLabel = collectElement.showLabels;
            let textPercentage = 0.85; // precentage of text height compared to text-line height
            let imagePercentage = collectElement.imageHeightPercentage / 100; // percentage of total height used for image
            let useSingleLine = collectElement.singleLine;
            let imageCount = collectedElements.length;
            let imgContainerHeight = showLabel ? height * imagePercentage : height;
            let imageRatios = [];
            for (const img of collectedElements.map((e) => getImage(e))) {
                let dim = await imageUtil.getImageDimensionsFromDataUrl(img);
                imageRatios.push(dim.ratio);
            }
            let maxImgRatio = Math.max(...imageRatios) || 1;
            let maxImages = Math.floor(width / (imgContainerHeight * maxImgRatio));
            let numLines = 1;
            while (maxImages < imageCount && !useSingleLine) {
                numLines++;
                maxImages = Math.floor(width / ((imgContainerHeight * maxImgRatio) / numLines)) * numLines;
            }
            imgContainerHeight = imgContainerHeight / numLines;
            let imgHeight = imgContainerHeight - imgMargin * 2;
            let lineHeight = height / numLines - imgContainerHeight;
            let textHeight = lineHeight * textPercentage;
            let totalWidth = 0;
            for (const [index, collectedElement] of collectedElements.entries()) {
                let label = collectedElement.fixedGrammarText || getSpeakTextOfElement(collectedElement);
                let image = getImage(collectedElement);
                let elemWidth = imgHeight * imageRatios[index] || imgHeight;
                let marked = markedImageIndex === index;
                let imgHTML = null;
                if (image) {
                    imgHTML = `<img src="${image}" height="${imgHeight}" style="height: ${imgHeight}px"/>`;
                    totalWidth += elemWidth + 2 * imgMargin;
                } else {
                    let fontSizeFactor = collectElement.textElemSizeFactor || 1.5;
                    let fontSize = textHeight * fontSizeFactor;
                    elemWidth =
                        fontUtil.getTextWidth(label, outerContainerJqueryElem[0], `${fontSize}px`) + 2 * imgMargin;
                    totalWidth += elemWidth + 4 * imgMargin;
                    imgHTML = `<div style="padding: ${imgMargin}px; font-size: ${fontSize}px; width: ${elemWidth}px; height: ${imgHeight}px; display: flex; justify-content: center; align-items: center; text-align: center;"><span>${label}</span></div>`;
                }
                html += `<div id="collect${index}" style="display: flex; flex:0; justify-content: center; flex-direction: column; padding: ${imgMargin}px; ${
                    marked ? 'background-color: lightgreen;' : ''
                }" title="${label}">
                                <div style="display:flex; justify-content: center">
                                        ${imgHTML}
                                </div>
                                <div style="text-align: center; font-size: ${textHeight}px; line-height: ${lineHeight}px; height: ${lineHeight}px; width: ${elemWidth}px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; ${
                    !showLabel ? 'display: none' : ''
                }">
                                    ${image ? label : ''}
                                </div>
                             </div>`;
            }
            let additionalCSS = useSingleLine ? 'overflow-x: auto; overflow-y: hidden;' : 'flex-wrap: wrap;';
            html = `<div class="collect-container" dir="auto" style="flex: 1; display: flex; flex-direction: row; background-color: #e8e8e8; text-align: justify; ${additionalCSS}">${html}</div>`;
            outerContainerJqueryElem.html(html);
            if (useSingleLine) {
                let scroll =
                    markedImageIndex !== null
                        ? maxImgRatio * imgHeight * markedImageIndex
                        : maxImgRatio * imgHeight * imageCount;
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

function getLastElement() {
    return collectedElements.slice(-1)[0];
}

function getLabel(element) {
    return i18nService.getTranslation(element.label) || '';
}

function setLabel(element, newLabel) {
    if (!element || !element.label) {
        return;
    }
    element.label[i18nService.getContentLang()] = newLabel;
}

function setLastLabel(newLabel) {
    setLabel(getLastElement(), newLabel);
}

function getLastLabel() {
    let lastElem = getLastElement();
    return lastElem ? getLabel(lastElem) : undefined;
}

function getImage(element) {
    return element.image ? element.image.data || element.image.url : null;
}

function getLastImage() {
    let lastElem = collectedElements.slice(-1)[0];
    return lastElem ? getImage(lastElem) : undefined;
}

function getSpeakTextObject(element, dontIncludeAudio, inlcudeCorrectedGrammar) {
    let audioAction = element.actions.filter((a) => a.modelName === GridActionAudio.getModelName())[0];
    if (audioAction && !dontIncludeAudio && audioAction.dataBase64) {
        return {
            base64Sound: audioAction.dataBase64
        };
    }
    let text = inlcudeCorrectedGrammar ? element.fixedGrammarText : null;
    let customSpeakAction = element.actions.filter((a) => a.modelName === GridActionSpeakCustom.getModelName())[0];
    if (customSpeakAction && !text) {
        let lang = customSpeakAction.speakLanguage || i18nService.getContentLang();
        text = i18nService.getTranslation(customSpeakAction.speakText, { forceLang: lang });
    }
    if (!text) {
        text = getLabel(element);
    }
    return {
        text: text
    };
}

function getSpeakTextOfElement(element) {
    let textObject = getSpeakTextObject(element, true);
    return textObject && textObject.text ? textObject.text : '';
}

function getSpeakTextObjectArray(includeCorrectedGrammar) {
    return collectedElements.map((e) => getSpeakTextObject(e, false, includeCorrectedGrammar));
}

function getSpeakTextArray() {
    return collectedElements.map((e) => getSpeakTextObject(e, true).text);
}

function getSpeakText() {
    return getSpeakTextArray().join(' ').trim().replace(/\s+/g, ' ');
}

function addTextElem(text) {
    collectedElements.push(
        new GridElement({
            label: i18nService.getTranslationObject(text)
        })
    );
}

$(window).on(constants.ELEMENT_EVENT_ID, function (event, element) {
    if (lastCollectId === element.id && new Date().getTime() - lastCollectTime < duplicatedCollectPause) {
        return;
    }
    lastCollectId = element.id;
    lastCollectTime = new Date().getTime();

    if (element.type === GridElement.ELEMENT_TYPE_COLLECT) {
        return;
    }

    let notIgonoreActions = [
        GridActionSpeak.getModelName(),
        GridActionSpeakCustom.getModelName(),
        GridActionNavigate.getModelName(),
        GridActionAudio.getModelName()
    ];
    let ignoreActions = GridElement.getActionTypeModelNames().filter((e) => !notIgonoreActions.includes(e));
    if (getActionTypes(element).some((type) => ignoreActions.includes(type))) {
        return; // dont collect elements containing "ignoreActions"
    }
    let navigateAction = getActionOfType(element, GridActionNavigate.getModelName());
    if (navigateAction && getLabel(element).length !== 1 && !navigateAction.addToCollectElem) {
        return; // no adding of text if the element contains an navigate action and it's no single keyboard character
    }

    let label = getLabel(element);
    let image = getImage(element);
    let lastImage = getLastImage();

    if (label && convertMode === TextConfig.CONVERT_MODE_LOWERCASE) {
        label = label.toLowerCase();
    }
    if (label && convertMode === TextConfig.CONVERT_MODE_UPPERCASE) {
        label = label.toUpperCase();
    }
    if (label && convertToLowercaseIfKeyboard && keyboardLikeFactor > 0.4) {
        label = label.toLowerCase();
    }
    setLabel(element, label);

    if (label || image) {
        if (
            label.length === 1 &&
            collectedElements.length > 0 &&
            !image &&
            !lastImage &&
            !collectedText.endsWith(' ')
        ) {
            let newLabel = getLastLabel() + label;
            setLastLabel(newLabel.trim());
        } else {
            collectedElements.push(element);
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
            let lastImageLabel = getLastLabel();
            if (
                lastImageLabel &&
                word.toLowerCase().startsWith(lastImageLabel.toLowerCase()) &&
                word.toLowerCase() !== lastImageLabel.toLowerCase()
            ) {
                setLastLabel(word);
            } else {
                addTextElem(word);
            }
            triggerPredict();
        }
    }
    updateCollectElements();
});

function triggerPredict() {
    registeredCollectElements.forEach((collectElement) => {
        let predictAction = getActionOfType(collectElement, 'GridActionPredict');
        if (predictAction && predictAction.suggestOnChange) {
            predictionService.predict(collectedText, dictionaryKey);
        }
    });
}

async function getMetadataConfig() {
    let metadata = await dataService.getMetadata();
    duplicatedCollectPause = metadata.inputConfig.globalMinPauseCollectSpeak || 0;
    convertMode = metadata.textConfig.convertMode;
    activateARASAACGrammarAPI = metadata.activateARASAACGrammarAPI;
}

$(window).on(constants.EVENT_GRID_RESIZE, function () {
    setTimeout(updateCollectElements, 500);
});

$(document).on(constants.EVENT_USER_CHANGED, clearAll);
$(document).on(constants.EVENT_CONFIG_RESET, clearAll);

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);
$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);

export { collectElementService };

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
import {arasaacService} from "./pictograms/arasaacService.js";
import {GridActionWordForm} from "../model/GridActionWordForm.js";
import {stateService} from "./stateService.js";
import {MapCache} from "../util/MapCache.js";

let collectElementService = {};

let registeredCollectElements = [];
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

let imgDimensionsCache = new MapCache();

collectElementService.getText = function () {
    return getPrintText();
};

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
        updateCollectElements();
        if (!dontAutoPredict) {
            predictionService.predict(getPredictText(), dictionaryKey);
        }
    }
};

collectElementService.clearCollectElements = function() {
    $('.collect-container').empty();
}

collectElementService.doCollectElementActions = async function (action) {
    if (!action) {
        return;
    }
    if (activateARASAACGrammarAPI && GridActionCollectElement.isSpeakAction(action)) {
        let speakText = getPrintText({ inlcudeCorrectedGrammar: false });
        speakText = await arasaacService.getCorrectGrammar(speakText);
        let changed = applyGrammarCorrection(speakText);
        if (changed) {
            updateCollectElements();
        }
    }
    let speakText = getPrintText({ dontIncludePronunciation: false });
    let speakArray = getSpeakArray();
    switch (action) {
        case GridActionCollectElement.COLLECT_ACTION_SPEAK:
            if (isSeparateMode(collectMode)) {
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
            if (isSeparateMode(collectMode)) {
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
            let last = getLastElement();
            let changed = false;
            if (last && last.onlyText) {
                let lastLabel = getLabel(last).trim() || '';
                let parts = lastLabel.split(' ');
                parts.pop();
                let newLabel = parts.join(' ');
                if (newLabel) {
                    changed = true;
                    setLabel(last, newLabel + ' ');
                } else {
                    changed = collectedElements.pop();
                }
            } else {
                changed = collectedElements.pop();
            }
            if (changed) {
                updateCollectElements();
            }
            speechService.stopSpeaking();
            break;
        case GridActionCollectElement.COLLECT_ACTION_REMOVE_CHAR:
            let lastElem = getLastElement();
            if (lastElem && lastElem.onlyText) {
                let label = getLabel(lastElem);
                label = label.slice(0, -1);
                if (label) {
                    setLabel(lastElem, label);
                } else {
                    collectedElements.pop();
                }
            } else {
                collectedElements.pop();
            }
            updateCollectElements();
            break;
        case GridActionCollectElement.COLLECT_ACTION_COPY_CLIPBOARD:
            util.copyToClipboard(getPrintText());
            break;
        case GridActionCollectElement.COLLECT_ACTION_APPEND_CLIPBOARD:
            util.appendToClipboard(getPrintText());
            break;
        case GridActionCollectElement.COLLECT_ACTION_CLEAR_CLIPBOARD:
            util.copyToClipboard('');
            break;
        case GridActionCollectElement.COLLECT_ACTION_TO_YOUTUBE:
            youtubeService.setActionAfterNavigate(
                new GridActionYoutube({
                    action: GridActionYoutube.actions.YT_PLAY,
                    playType: GridActionYoutube.playTypes.YT_PLAY_SEARCH,
                    data: getPrintText()
                })
            );
            break;
    }
    predictionService.predict(getPredictText(), dictionaryKey);
};

collectElementService.addWordFormTagsToLast = function (tags, toggle) {
    let lastElement = collectedElements[collectedElements.length - 1];
    if (lastElement && !lastElement.wordFormFixated) {
        let lastElementCopy = JSON.parse(JSON.stringify(lastElement));
        lastElementCopy.wordFormTags = lastElementCopy.wordFormTags || [];
        let currentLabel = getPrintTextOfElement(lastElementCopy);
        lastElementCopy.wordFormTags = stateService.mergeTags(lastElementCopy.wordFormTags, tags, toggle);
        let newLabel = stateService.getWordForm(lastElementCopy, {searchTags: lastElementCopy.wordFormTags, searchSubTags: true});
        if (newLabel && newLabel !== currentLabel) {
            collectedElements[collectedElements.length - 1] = lastElementCopy;
            updateCollectElements();
        }
    }
};

collectElementService.replaceLast = function (element, currentId) {
    element = JSON.parse(JSON.stringify(element));
    let lastElement = collectedElements[collectedElements.length - 1];
    if (lastElement && lastElement.id === element.id) {
        collectedElements.pop();
    }
    element.wordFormId = currentId;
    collectedElements.push(element);
    updateCollectElements();
};

collectElementService.fixateLastWordForm = function () {
    let lastElement = collectedElements[collectedElements.length - 1];
    if (lastElement) {
        lastElement.wordFormFixated = true;
    }
}

/**
 * @return returns true if the current grid is (probably) a keyboard
 */
collectElementService.isCurrentGridKeyboard = function () {
    return keyboardLikeFactor > 0.4;
}

async function applyGrammarCorrection(newText) {
    let changedSomething = false;
    let originalText = getPrintText({ inlcudeCorrectedGrammar: false });
    if (originalText === newText) {
        return false;
    }
    let originalWords = originalText.split(' ');
    let newWords = newText.split(' ');
    if (originalWords.length !== newWords.length) {
        return false;
    }
    for (let element of collectedElements) {
        let label = getPrintTextOfElement(element).trim().replace(/\s+/g, ' ');
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

function getActionsOfType(elem, type) {
    if (!elem) {
        return [];
    }
    return elem.actions.filter(action => action.modelName === type);
}

function getActionTypes(elem) {
    return elem.actions.map((action) => action.modelName);
}

async function updateCollectElements(isSecondTry) {
    autoCollectImage = collectedElements.some((e) => !!getImageData(e));
    let metadata = null;
    if (registeredCollectElements.length > 0) {
        metadata = await dataService.getMetadata();
    }
    for (let collectElement of registeredCollectElements) {
        let txtBackgroundColor = metadata.colorConfig.gridBackgroundColor || '#ffffff';
        let imageMode = isSeparateMode(collectElement.mode);
        let outerContainerJqueryElem = $(`#${collectElement.id} .collect-outer-container`);
        if (!imageMode) {
            let text = getPrintText();
            $(`#${collectElement.id}`).attr('aria-label', `${text}, ${i18nService.t('ELEMENT_TYPE_COLLECT')}`);
            predictionService.learnFromInput(text, dictionaryKey);
            let html = `<span style="padding: 5px; display: flex; align-items: center; flex: 1; text-align: left;">
                            ${text}
                        </span>`;
            outerContainerJqueryElem.html(
                (html = `<div class="collect-container" dir="auto" style="height: 100%; flex: 1; background-color: #e8e8e8; text-align: justify;">${html}</div>`)
            );
            fontUtil.adaptFontSize($(`#${collectElement.id}`));
        } else {
            $(`#${collectElement.id}`).attr(
                'aria-label',
                `${getPrintText()}, ${i18nService.t('ELEMENT_TYPE_COLLECT')}`
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
            for (const elem of collectedElements) {
                let imageData = getImageData(elem);
                if (imageData) {
                    if (elem.image.searchProviderName) {
                        imageRatios.push(1);
                    } else if (imgDimensionsCache.has(imageData)) {
                        imageRatios.push(imgDimensionsCache.get(imageData));
                    } else {
                        let dim = await imageUtil.getImageDimensionsFromDataUrl(imageData);
                        imageRatios.push(dim.ratio);
                        imgDimensionsCache.set(imageData, dim.ratio);
                    }
                }
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
                let label = getPrintTextOfElement(collectedElement);
                let image = getImageData(collectedElement);
                let elemWidth = imgHeight * imageRatios[index] || imgHeight;
                if (collectElement.showFullLabels) {
                    let textWidth = fontUtil.getTextWidth(label, outerContainerJqueryElem[0], `${textHeight}px`);
                    elemWidth = Math.max(elemWidth, textWidth + 2 * imgMargin);
                }
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
                                <div style="text-align: center; font-weight: bold; font-size: ${textHeight}px; line-height: ${lineHeight}px; height: ${lineHeight}px; width: ${elemWidth}px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; ${
                    !showLabel ? 'display: none' : ''
                }">
                                    ${image ? label : ''}
                                </div>
                             </div>`;
            }
            let additionalCSS = useSingleLine ? 'overflow-x: auto; overflow-y: hidden;' : 'flex-wrap: wrap;';
            html = `<div class="collect-container" dir="auto" style="height: 100%; flex: 1; display: flex; flex-direction: row; background-color: #e8e8e8; text-align: justify; ${additionalCSS}">${html}</div>`;
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

function isSeparateMode(collectElementMode) {
    switch (collectElementMode) {
        case GridElementCollect.MODE_COLLECT_SEPARATED:
            return true;
        case GridElementCollect.MODE_COLLECT_TEXT:
            return false;
    }
    return autoCollectImage;
}

function getLastElement() {
    return collectedElements.slice(-1)[0];
}

function getLabel(element) {
    if (!element) {
        return '';
    }
    return i18nService.getTranslation(element.label) || '';
}

function setLabel(element, newLabel) {
    if (!element || !element.label) {
        return;
    }
    element.label[i18nService.getContentLang()] = newLabel;
}

function getImageData(element) {
    return element.image ? element.image.data || element.image.url : null;
}

/**
 *
 * @param element
 * @param options.dontIncludeAudio
 * @param options.inlcudeCorrectedGrammar
 * @param options.dontIncludePronunciation
 * @return {{text: *}|{base64Sound: ([String | StringConstructor]|[String | StringConstructor]|null|*)}}
 */
function getOutputObject(element, options) {
    options = options || {};
    let audioAction = element.actions.filter((a) => a.modelName === GridActionAudio.getModelName())[0];
    if (audioAction && !options.dontIncludeAudio && audioAction.dataBase64) {
        return {
            base64Sound: audioAction.dataBase64
        };
    }
    let text = options.inlcudeCorrectedGrammar ? element.fixedGrammarText : null;
    let customSpeakAction = element.actions.filter((a) => a.modelName === GridActionSpeakCustom.getModelName())[0];
    if (!text && customSpeakAction) {
        let lang = customSpeakAction.speakLanguage || i18nService.getContentLang();
        text = i18nService.getTranslation(customSpeakAction.speakText, { lang: lang });
    }
    if (!text) {
        let wordForm = stateService.getWordFormObject(element, {searchTags: element.wordFormTags, wordFormId: element.wordFormId, searchSubTags: true}) || {};
        if (!options.dontIncludePronunciation) {
            text = wordForm.pronunciation;
        }
        text = text || wordForm.value;
    }
    if (!text) {
        text = getLabel(element);
    }
    text = util.convertLowerUppercase(text, convertMode);
    return {
        text: text
    };
}

function getSpeakArray(options) {
    options = options || {};
    options.inlcudeCorrectedGrammar =
        options.inlcudeCorrectedGrammar !== undefined ? options.inlcudeCorrectedGrammar : true;
    return collectedElements.map((e) => getOutputObject(e, options));
}

function getPrintText(options) {
    options = options || {};
    options.trim = options.trim !== undefined ? options.trim : true;
    options.dontIncludeAudio = true;
    options.dontIncludePronunciation =
        options.dontIncludePronunciation !== undefined ? options.dontIncludePronunciation : true;
    options.inlcudeCorrectedGrammar =
        options.inlcudeCorrectedGrammar !== undefined ? options.inlcudeCorrectedGrammar : true;
    let textArray = collectedElements.map((e) => getOutputObject(e, options).text)
    let returnValue = options.trim ? textArray.join(' ').trim() : textArray.join(' ');
    return returnValue.replace(/\s+/g, ' ');
}

function getPredictText() {
    return getPrintText({trim: false});
}

function getPrintTextOfElement(element) {
    let textObject = getOutputObject(element,  {
        dontIncludePronunciation: true,
        dontIncludeAudio: true,
        inlcudeCorrectedGrammar: true
    });
    return textObject && textObject.text ? textObject.text : '';
}

function addTextElem(text) {
    let newElem = new GridElement({
        label: i18nService.getTranslationObject(text)
    });
    newElem.onlyText = true;
    collectedElements.push(newElem);
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
        GridActionAudio.getModelName(),
        GridActionWordForm.getModelName()
    ];
    let ignoreActions = GridElement.getActionTypeModelNames().filter((e) => !notIgonoreActions.includes(e));
    if (getActionTypes(element).some((type) => ignoreActions.includes(type))) {
        return; // dont collect elements containing "ignoreActions"
    }
    let navigateAction = getActionOfType(element, GridActionNavigate.getModelName());
    if (navigateAction && getLabel(element).length !== 1 && !navigateAction.addToCollectElem) {
        return; // no adding of text if the element contains an navigate action and it's no single keyboard character
    }
    let wordFormActions = getActionsOfType(element, GridActionWordForm.getModelName());
    if (wordFormActions.length > 0 && wordFormActions.some(a => a.type === GridActionWordForm.WORDFORM_MODE_NEXT_FORM)) {
        return; // no adding, since the action itself adds the element
    }
    if (element.dontCollect) {
        return;
    }
    if (element.toggleInBar) {
        let lastElement = getLastElement();
        if (lastElement && lastElement.id === element.id) {
            collectedElements.pop();
            updateCollectElements();
            return;
        }
    }

    if (element.type === GridElement.ELEMENT_TYPE_NORMAL) {
        element.wordFormTags = stateService.getCurrentWordFormTags();
        let label = getLabel(element);
        let printText = getPrintTextOfElement(element);
        let image = getImageData(element);
        if (label && label.length === 1 && collectElementService.isCurrentGridKeyboard()) {
            if (convertToLowercaseIfKeyboard) {
                label = label.toLowerCase();
            }
            let lastElem = getLastElement();
            if (lastElem && lastElem.onlyText) {
                setLabel(lastElem, getLabel(lastElem) + label);
            } else {
                addTextElem(label);
            }
        } else if (label || image || printText) {
            collectedElements.push(element);
        }
        triggerPredict();
    } else if (element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
        let word = $(`#${element.id} .text-container span`).text();
        if (word) {
            predictionService.applyPrediction(getPrintText(), word, dictionaryKey);
            let lastElem = getLastElement();
            let lastLabel = getLabel(lastElem);
            let lastWord = lastLabel ? lastLabel.split(' ').pop() : '';
            if (
                lastElem &&
                lastElem.onlyText &&
                word.toLowerCase().startsWith(lastWord.toLowerCase())
            ) {
                let parts = lastLabel.split(' ');
                parts[parts.length - 1] = word;
                setLabel(lastElem, parts.join(' ') + ' ');
            } else {
                addTextElem(word + ' ');
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
            predictionService.predict(getPredictText(), dictionaryKey);
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

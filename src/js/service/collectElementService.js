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
import { liveElementService } from './liveElementService';
import { MetaData } from '../model/MetaData';
import { GridData } from '../model/GridData';

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
let _localMetadata = null;

// Store pending prefix to apply to next word
collectElementService._pendingPrefix = null;

collectElementService.getText = function () {
    return getPrintText();
};

collectElementService.initWithGrid = function (gridData, dontAutoPredict) {
    registeredCollectElements = [];
    let oneCharacterElements = 0;
    let normalElements = 0;
    dictionaryKey = null;
    gridData.gridElements.forEach((element) => {
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
    if (gridData.keyboardMode) {
        keyboardLikeFactor = gridData.keyboardMode === GridData.KEYBOARD_DISABLED ? 0 : 1;
    } else {
        keyboardLikeFactor = oneCharacterElements / normalElements;
    }
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

/**
 * does ARASAAC grammar correction for the current collected sentence (if enabled in settings)
 * @returns {Promise<void>}
 */
collectElementService.doARASAACGrammarCorrection = async function() {
    if (activateARASAACGrammarAPI) {
        let speakText = getPrintText({ inlcudeCorrectedGrammar: false });
        speakText = await arasaacService.getCorrectGrammar(speakText);
        let changed = applyGrammarCorrection(speakText);
        if (changed) {
            await updateCollectElements();
        }
    }
}

collectElementService.doCollectElementActions = async function (action) {
    if (!action) {
        return;
    }
    if (GridActionCollectElement.isSpeakAction(action)) {
        await collectElementService.doARASAACGrammarCorrection();
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
        case GridActionCollectElement.COLLECT_ACTION_SHARE: {
            let blob = await util.getCollectContentBlob();
            await util.shareImageBlob(blob, collectElementService.getText());
            break;
        }
        case GridActionCollectElement.COLLECT_ACTION_COPY_IMAGE_CLIPBOARD:
            await util.copyCollectContentToClipboard();
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

collectElementService.hasCollectedImage = function() {
    return collectedElements.some((e) => !!getImageData(e));
};

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
    collectElementService._pendingPrefix = null; // Clear any pending prefix
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
    let metadata = _localMetadata || new MetaData();
    for (let collectElement of registeredCollectElements) {
        let txtBackgroundColor = metadata.colorConfig.gridBackgroundColor || '#ffffff';
        let imageMode = isSeparateMode(collectElement.mode);
        let outerContainerJqueryElem = $(`#${collectElement.id} .collect-outer-container`);
        let darkMode = metadata.colorConfig.elementBackgroundColor === constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK;
        let backgroundColor = darkMode ? constants.DEFAULT_COLLECT_ELEMENT_BACKGROUND_COLOR_DARK : constants.DEFAULT_COLLECT_ELEMENT_BACKGROUND_COLOR;
        let textColor = darkMode ? constants.DEFAULT_ELEMENT_FONT_COLOR_DARK : constants.DEFAULT_ELEMENT_FONT_COLOR;
        if (!imageMode) {
            let text = getPrintText();
            $(`#${collectElement.id}`).attr('aria-label', `${text}, ${i18nService.t('ELEMENT_TYPE_COLLECT')}`);
            predictionService.learnFromInput(text, dictionaryKey);
            let html = `<span style="padding: 5px; display: flex; align-items: center; flex: 1; text-align: left; font-weight: bold;">
                            ${text}
                        </span>`;
            outerContainerJqueryElem.html(
                (html = `<div class="collect-container" dir="auto" style="height: 100%; flex: 1; background-color: ${backgroundColor}; text-align: justify;">${html}</div>`)
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
                html += `<div id="collect${index}" style="display: flex; flex:0; justify-content: center; flex-direction: column; padding: ${imgMargin}px; color: ${textColor}; ${
                    marked ? `background-color: ${darkMode ? 'darkgreen' : 'lightgreen'};` : ''
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
            html = `<div class="collect-container" dir="auto" style="height: 100%; flex: 1; display: flex; flex-direction: row; background-color: ${backgroundColor}; text-align: justify; ${additionalCSS}">
                        <div class="collect-items-container" style="display: flex; flex-direction: row; ">${html}</div>
                    </div>`;
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
    if (!text) {
        text = stateService.getFirstForm(element);
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

/**
 * Combines text array considering prefix/suffix rules
 * @param {Array} textArray - Array of text strings from collected elements
 * @returns {string} - Combined text with proper prefix/suffix handling
 */
function combineTextWithPrefixSuffix(textArray) {
    if (!textArray || textArray.length === 0) {
        return '';
    }
    
    let result = [];
    
    for (let i = 0; i < textArray.length; i++) {
        let currentText = textArray[i];
        let currentElement = collectedElements[i];
        
        // Check multiple ways to determine if element is prefix/suffix
        let isCurrentPrefix = isElementPrefix(currentElement);
        let isCurrentSuffix = isElementSuffix(currentElement);
        
        if (i === 0) {
            // First element, just add it
            result.push(currentText);
        } else {
            let previousElement = collectedElements[i - 1];
            let isPreviousPrefix = isElementPrefix(previousElement);
            let isPreviousSuffix = isElementSuffix(previousElement);
            
            // Check if we should combine without space
            if (isPreviousPrefix || isCurrentSuffix) {
                // Combine without space: prefix+word or word+suffix
                result[result.length - 1] += currentText;
            } else {
                // Normal combination with space
                result.push(currentText);
            }
        }
    }
    
    return result.join(' ');
}

/**
 * Check if an element should be treated as a prefix
 * @param {Object} element - Grid element
 * @returns {boolean}
 */
function isElementPrefix(element) {
    if (!element) return false;
    
    // Method 1: Check current word form object
    let currentWordForm = stateService.getWordFormObject(element, {
        searchTags: element.wordFormTags, 
        wordFormId: element.wordFormId, 
        searchSubTags: true
    });
    if (currentWordForm && currentWordForm.isPrefix) {
        return true;
    }
    
    // Method 2: Check if any word form has PREFIX tag
    if (element.wordForms) {
        for (let wordForm of element.wordForms) {
            if (wordForm.isPrefix || (wordForm.tags && wordForm.tags.includes('PREFIX'))) {
                return true;
            }
        }
    }
    
    // Method 3: Check if element label suggests it's a prefix (common prefixes)
    let label = getLabel(element).toLowerCase().trim();
    let commonPrefixes = ['un', 're', 'pre', 'dis', 'in', 'im', 'non', 'anti', 'de', 'over', 'under', 'out', 'up'];
    if (commonPrefixes.includes(label)) {
        return true;
    }
    
    return false;
}

/**
 * Check if an element should be treated as a suffix
 * @param {Object} element - Grid element
 * @returns {boolean}
 */
function isElementSuffix(element) {
    if (!element) return false;
    
    // Method 1: Check current word form object
    let currentWordForm = stateService.getWordFormObject(element, {
        searchTags: element.wordFormTags, 
        wordFormId: element.wordFormId, 
        searchSubTags: true
    });
    if (currentWordForm && currentWordForm.isSuffix) {
        return true;
    }
    
    // Method 2: Check if any word form has SUFFIX tag
    if (element.wordForms) {
        for (let wordForm of element.wordForms) {
            if (wordForm.isSuffix || (wordForm.tags && wordForm.tags.includes('SUFFIX'))) {
                return true;
            }
        }
    }
    
    // Method 3: Check if element label suggests it's a suffix (common suffixes)
    let label = getLabel(element).toLowerCase().trim();
    let commonSuffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment', 'ful', 'less', 'able', 'ible', 's'];
    if (commonSuffixes.includes(label)) {
        return true;
    }
    
    return false;
}

/**
 * Apply suffix to the last element by modifying its word form
 * @param {string} suffix - The suffix to apply (e.g., "ing", "ed")
 * @returns {boolean} - True if suffix was applied successfully
 */
function applySuffixToLastElement(suffix) {
    let lastElement = getLastElement();
    if (!lastElement) {
        return false;
    }
    
    // Get the base word
    let baseWord = getLabel(lastElement).trim();
    if (!baseWord) {
        return false;
    }
    
    // Create the modified word
    let modifiedWord = applyMorphology(baseWord, suffix);
    
    // Update the last element's label
    setLabel(lastElement, modifiedWord);
    
    return true;
}

/**
 * Apply prefix to the next word by storing it temporarily
 * @param {string} prefix - The prefix to apply (e.g., "un", "re")
 * @returns {boolean} - True if prefix was stored successfully
 */
function storePrefixForNextElement(prefix) {
    // Store the prefix to be applied to the next word
    collectElementService._pendingPrefix = prefix.toLowerCase().trim();
    return true;
}

/**
 * Apply stored prefix to current element
 * @param {Object} element - The element to apply prefix to
 * @returns {boolean} - True if prefix was applied
 */
function applyStoredPrefixToElement(element) {
    if (!collectElementService._pendingPrefix) {
        return false;
    }
    
    let baseWord = getLabel(element).trim();
    if (!baseWord) {
        return false;
    }
    
    // Create the modified word with prefix
    let modifiedWord = collectElementService._pendingPrefix + baseWord.toLowerCase();
    
    // Update the element's label
    setLabel(element, modifiedWord);
    
    // Clear the pending prefix
    collectElementService._pendingPrefix = null;
    
    return true;
}

/**
 * Apply morphological rules when adding suffixes
 * @param {string} baseWord - The base word
 * @param {string} suffix - The suffix to add
 * @returns {string} - The correctly formed word
 */
function applyMorphology(baseWord, suffix) {
    let base = baseWord.toLowerCase();
    let result = base;
    
    switch (suffix) {
        case 'ing':
            // Rules for adding -ing
            if (base.endsWith('e') && !base.endsWith('ie')) {
                result = base.slice(0, -1) + 'ing'; // make -> making
            } else if (base.endsWith('ie')) {
                result = base.slice(0, -2) + 'ying'; // die -> dying
            } else if (isDoubleConsonantWord(base)) {
                result = base + base.slice(-1) + 'ing'; // run -> running
            } else {
                result = base + 'ing'; // walk -> walking
            }
            break;
            
        case 'ed':
            // Rules for adding -ed
            if (base.endsWith('e')) {
                result = base + 'd'; // make -> made
            } else if (base.endsWith('y') && !isVowel(base[base.length - 2])) {
                result = base.slice(0, -1) + 'ied'; // try -> tried
            } else if (isDoubleConsonantWord(base)) {
                result = base + base.slice(-1) + 'ed'; // stop -> stopped
            } else {
                result = base + 'ed'; // walk -> walked
            }
            break;
            
        case 'er':
            // Rules for adding -er (comparative)
            if (base.endsWith('e')) {
                result = base + 'r'; // large -> larger
            } else if (base.endsWith('y') && !isVowel(base[base.length - 2])) {
                result = base.slice(0, -1) + 'ier'; // happy -> happier
            } else if (isDoubleConsonantWord(base)) {
                result = base + base.slice(-1) + 'er'; // big -> bigger
            } else {
                result = base + 'er'; // fast -> faster
            }
            break;
            
        case 'est':
            // Rules for adding -est (superlative)
            if (base.endsWith('e')) {
                result = base + 'st'; // large -> largest
            } else if (base.endsWith('y') && !isVowel(base[base.length - 2])) {
                result = base.slice(0, -1) + 'iest'; // happy -> happiest
            } else if (isDoubleConsonantWord(base)) {
                result = base + base.slice(-1) + 'est'; // big -> biggest
            } else {
                result = base + 'est'; // fast -> fastest
            }
            break;
            
        case 's':
            // Rules for adding -s (plural/3rd person)
            if (base.endsWith('s') || base.endsWith('sh') || base.endsWith('ch') || base.endsWith('x') || base.endsWith('z')) {
                result = base + 'es'; // box -> boxes
            } else if (base.endsWith('y') && !isVowel(base[base.length - 2])) {
                result = base.slice(0, -1) + 'ies'; // city -> cities
            } else {
                result = base + 's'; // cat -> cats
            }
            break;
            
        default:
            // For other suffixes, just add them
            result = base + suffix;
    }
    
    return result;
}

/**
 * Check if a word should double its final consonant before adding suffix
 * @param {string} word - The word to check
 * @returns {boolean}
 */
function isDoubleConsonantWord(word) {
    if (word.length < 3) return false;
    
    let lastChar = word[word.length - 1];
    let secondLastChar = word[word.length - 2];
    let thirdLastChar = word[word.length - 3];
    
    // Must end with consonant-vowel-consonant pattern
    return !isVowel(lastChar) && isVowel(secondLastChar) && !isVowel(thirdLastChar) &&
           // Don't double w, x, y
           !['w', 'x', 'y'].includes(lastChar) &&
           // Usually single syllable or stressed final syllable
           (word.length <= 4 || ['admit', 'begin', 'commit', 'occur', 'prefer', 'refer'].includes(word));
}

/**
 * Check if a character is a vowel
 * @param {string} char - Character to check
 * @returns {boolean}
 */
function isVowel(char) {
    return char && 'aeiou'.includes(char.toLowerCase());
}

function getPrintText(options) {
    options = options || {};
    options.trim = options.trim !== undefined ? options.trim : true;
    options.dontIncludeAudio = true;
    options.dontIncludePronunciation =
        options.dontIncludePronunciation !== undefined ? options.dontIncludePronunciation : true;
    options.inlcudeCorrectedGrammar =
        options.inlcudeCorrectedGrammar !== undefined ? options.inlcudeCorrectedGrammar : true;
    
    let textArray = collectedElements.map((e) => getOutputObject(e, options).text);
    let combinedText = combineTextWithPrefixSuffix(textArray);
    let returnValue = options.trim ? combinedText.trim() : combinedText;
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
        
        // Check if this element is a suffix that should modify the previous word
        if (label && isElementSuffix(element) && collectedElements.length > 0) {
            let success = applySuffixToLastElement(label.toLowerCase().trim());
            if (success) {
                updateCollectElements();
                triggerPredict();
                return; // Don't add the suffix as a separate element
            }
        }
        
        // Check if this element is a prefix that should be applied to the next word
        if (label && isElementPrefix(element)) {
            let success = storePrefixForNextElement(label.toLowerCase().trim());
            if (success) {
                // Don't add the prefix as a separate element, just store it
                triggerPredict();
                return;
            }
        }
        
        // Check if we have a pending prefix to apply to this element
        if (label && collectElementService._pendingPrefix) {
            let success = applyStoredPrefixToElement(element);
            if (success) {
                // Add the modified element (with prefix applied)
                collectedElements.push(element);
                updateCollectElements();
                triggerPredict();
                return;
            }
        }
        
        if (label && collectElementService.isCurrentGridKeyboard()) {
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
        let word = predictionService.getCurrentValue(element.id);
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
    } else if (element.type === GridElement.ELEMENT_TYPE_LIVE) {
        addTextElem(liveElementService.getLastValue(element.id) + ' ');
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
    _localMetadata = await dataService.getMetadata();
    duplicatedCollectPause = _localMetadata.inputConfig.globalMinPauseCollectSpeak || 0;
    convertMode = _localMetadata.textConfig.convertMode;
    activateARASAACGrammarAPI = _localMetadata.activateARASAACGrammarAPI;
}

$(window).on(constants.EVENT_GRID_RESIZE, function () {
    setTimeout(updateCollectElements, 500);
});

$(document).on(constants.EVENT_USER_CHANGED, clearAll);
$(document).on(constants.EVENT_CONFIG_RESET, clearAll);

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);
$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);
$(document).on(constants.EVENT_USERSETTINGS_UPDATED, () => {
    updateCollectElements();
});

export { collectElementService };

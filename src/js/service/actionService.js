import { areService } from './areService';
import { openHABService } from './openHABService';
import { httpService } from './httpService.js';
import { dataService } from './data/dataService';
import { speechService } from './speechService';
import { collectElementService } from './collectElementService';
import { predictionService } from './predictionService';
import { Router } from './../router';
import { GridElement } from './../model/GridElement';
import { constants } from '../util/constants';
import { GridActionCollectElement } from '../model/GridActionCollectElement';
import { webradioService } from './webradioService';
import { i18nService } from './i18nService';
import { youtubeService } from './youtubeService';
import { GridActionNavigate } from '../model/GridActionNavigate.js';
import { GridActionChangeLang } from '../model/GridActionChangeLang.js';
import $ from '../externals/jquery.js';
import { GridActionAudio } from '../model/GridActionAudio.js';
import { GridActionSpeak } from '../model/GridActionSpeak.js';
import { GridActionSpeakCustom } from '../model/GridActionSpeakCustom.js';
import {audioUtil} from "../util/audioUtil.js";
import {MainVue} from "../vue/mainVue.js";
import {stateService} from "./stateService.js";
import {GridActionWordForm} from "../model/GridActionWordForm.js";
import {localStorageService} from "./data/localStorageService.js";
import {uartService} from './uartService.js';
import { systemActionService } from './systemActionService';
import { GridActionSystem } from '../model/GridActionSystem';
import { util } from '../util/util';
import { liveElementService } from './liveElementService';
import { GridElementLive } from '../model/GridElementLive';
import { GridActionYoutube } from '../model/GridActionYoutube';
import { GridActionWebradio } from '../model/GridActionWebradio';

let actionService = {};

let METADATA_URL_ACTIONS = constants.IS_ENVIRONMENT_PROD ? constants.BOARDS_REPO_BASE_URL + "live_predefined_actions.json" : constants.BOARDS_REPO_BASE_URL + "live_predefined_actions_beta.json";
let METADATA_URL_REQUESTS = constants.IS_ENVIRONMENT_PROD ? constants.BOARDS_REPO_BASE_URL + "live_predefined_requests.json" : constants.BOARDS_REPO_BASE_URL + "live_predefined_requests_beta.json";
let predefinedActionsData = {};

let minPauseSpeak = 0;
let metadata = null;

actionService.doAction = async function (gridIdOrObject, gridElementId) {
    if (!gridIdOrObject || !gridElementId) {
        return;
    }
    let gridData = gridIdOrObject.gridElements ? gridIdOrObject : (await dataService.getGrid(gridIdOrObject, false, true));
    let gridElement = JSON.parse(JSON.stringify(gridData.gridElements.find(e => e.id === gridElementId)));

    log.debug('do actions for: ' + i18nService.getTranslation(gridElement.label) + ', ' + gridElementId);
    switch (gridElement.type) {
        case GridElement.ELEMENT_TYPE_PREDICTION: {
            predictionService.doAction(gridElement.id);
            break;
        }
    }
    doActions(gridElement, gridData.id);
};

actionService.testAction = function (gridElement, action, gridData = {}) {
    return doAction(gridElement, action, {
        gridId: gridData.id,
        gridData: gridData
    });
};

actionService.getPredefinedActionInfos = async function() {
    return getPredefinedInfos(METADATA_URL_ACTIONS);
};

actionService.getPredefinedRequestInfos = async function() {
    return getPredefinedInfos(METADATA_URL_REQUESTS);
};

async function doActions(gridElement, gridId) {
    let actions = gridElement.actions;
    actions.sort((a, b) => {
        // do lang change before navigation
        if (a.modelName === GridActionChangeLang.getModelName() && b.modelName === GridActionNavigate.getModelName()) {
            return -1;
        }
        if (b.modelName === GridActionChangeLang.getModelName() && a.modelName === GridActionNavigate.getModelName()) {
            return 1;
        }
        if (a.modelName === GridActionSystem.getModelName()) { // do system actions first (e.g. set volume)
            return -1;
        }
        return 0;
    });
    let hasAudioAction = actions.some((a) => a.modelName === GridActionAudio.getModelName() && a.dataBase64);
    if (hasAudioAction) {
        actions = actions.filter(
            (a) =>
                a.modelName !== GridActionSpeak.getModelName() && a.modelName !== GridActionSpeakCustom.getModelName()
        );
    }
    $(window).trigger(constants.ELEMENT_EVENT_ID, [gridElement]);
    actions.forEach((action) => {
        doAction(gridElement, action, {
            gridId: gridId,
            actions: actions
        });
    });
    metadata = metadata || (await dataService.getMetadata());
    let actionTypes = actions.map((a) => a.modelName);
    let navBackActions = [GridActionAudio.getModelName(), GridActionChangeLang.getModelName(), GridActionSpeak.getModelName(), GridActionSpeakCustom.getModelName()];
    let noNavBackActions = GridElement.getActionTypeModelNames().filter((name) => !navBackActions.includes(name));
    if (
        metadata.toHomeAfterSelect &&
        !collectElementService.isCurrentGridKeyboard() &&
        !stateService.hasGlobalGridElement(gridElement.id) &&
        !actionTypes.some((type) => noNavBackActions.includes(type))
    ) {
        Router.toMain();
    }
    if (!actionTypes.includes(GridActionWordForm.getModelName())) {
        stateService.resetWordForms();
    }
    let displayUpdateActions = [GridActionYoutube.getModelName(), GridActionWebradio.getModelName(), GridActionSystem.getModelName()];
    if (actionTypes.some(type => displayUpdateActions.includes(type))) {
        liveElementService.updateOnce({ updateModes: [GridElementLive.MODE_APP_STATE] });
    }
}

/**
 *
 * @param gridElement
 * @param action
 * @param options
 * @param options.gridId the id of the grid the action is contained in (only needed for GridActionWebradio and GridActionARE)
 * @param options.gridData the gridData object the action is contained in (optional)
 * @param options.actions all actions that are currently executed
 */
async function doAction(gridElement, action, options = {}) {
    options = options || {};
    options.actions = options.actions || [];

    switch (action.modelName) {
        case 'GridActionSpeak':
            log.debug('action speak');
            let langWordFormMap = stateService.getSpeakTextAllLangs(gridElement.id);
            let labelCopy = JSON.parse(JSON.stringify(gridElement.label));
            Object.assign(labelCopy, langWordFormMap);
            if (gridElement.type === GridElement.ELEMENT_TYPE_PREDICTION) {
                labelCopy[i18nService.getContentLang()] = predictionService.getLastAppliedPrediction();
            }
            if (gridElement.type === GridElement.ELEMENT_TYPE_LIVE) {
                labelCopy[i18nService.getContentLang()] = liveElementService.getLastValue(gridElement.id);
            }
            speechService.speak(labelCopy, {
                lang: action.speakLanguage,
                speakSecondary: true,
                minEqualPause: minPauseSpeak
            });
            break;
        case 'GridActionSpeakCustom':
            log.debug('action speak custom');
            if (action.speakText) {
                let text = action.speakText;
                if (gridElement.type === GridElement.ELEMENT_TYPE_LIVE) {
                    text[i18nService.getContentLang()] = liveElementService.replacePlaceholder(gridElement, text[i18nService.getContentLang()]);
                }
                speechService.speak(text, {
                    lang: action.speakLanguage,
                    speakSecondary: true,
                    minEqualPause: minPauseSpeak
                });
            }
            break;
        case 'GridActionAudio':
            if (action.dataBase64) {
                audioUtil.stopAudio();
                audioUtil.playAudio(action.dataBase64);
            }
            break;
        case 'GridActionWordForm':
            switch (action.type) {
                case GridActionWordForm.WORDFORM_MODE_CHANGE_ELEMENTS:
                    stateService.resetWordFormIds(gridElement);
                    stateService.addWordFormTags(action.tags, action.toggle);
                    break;
                case GridActionWordForm.WORDFORM_MODE_CHANGE_BAR:
                    collectElementService.addWordFormTagsToLast(action.tags);
                    break;
                case GridActionWordForm.WORDFORM_MODE_CHANGE_EVERYWHERE:
                    stateService.resetWordFormIds(gridElement);
                    stateService.addWordFormTags(action.tags, action.toggle);
                    collectElementService.addWordFormTagsToLast(action.tags);
                    break;
                case GridActionWordForm.WORDFORM_MODE_NEXT_FORM:
                    let currentId = stateService.nextWordForm(gridElement.id);
                    collectElementService.replaceLast(gridElement, currentId);
                    if (action.secondaryType) {
                        let wordForm = stateService.getWordFormObject(gridElement, { wordFormId: currentId });
                        let tags = wordForm.tags || [];
                        if (tags.length > 0) {
                            stateService.resetWordFormTags();
                            let newAction = new GridActionWordForm({ type: action.secondaryType, tags: tags });
                            await doAction(gridElement, newAction, options);
                        }
                    }
                    break;
                case GridActionWordForm.WORDFORM_MODE_RESET_FORMS:
                    stateService.resetWordForms();
                    collectElementService.fixateLastWordForm();
                    break;
            }
            break;
        case 'GridActionNavigate':
            if (action.navType === GridActionNavigate.NAV_TYPES.TO_HOME) {
                Router.toMain();
            } else if (action.navType === GridActionNavigate.NAV_TYPES.TO_LAST) {
                Router.toLastGrid();
            } else if (action.navType === GridActionNavigate.NAV_TYPES.OPEN_SEARCH) {
                MainVue.showSearchModal(action);
            } else if (Router.isOnEditPage()) {
                Router.toEditGrid(action.toGridId);
            } else {
                Router.toGrid(action.toGridId);
            }
            break;
        case 'GridActionARE':
            log.debug('action are');
            if (options.gridData) {
                doAREAction(action, options.gridData);
            } else {
                dataService.getGrid(options.gridId).then((grid) => {
                    doAREAction(action, grid);
                });
            }
            break;
        case 'GridActionOpenHAB':
            log.debug('action openHAB');
            openHABService.sendAction(action);
            break;
        case 'GridActionHTTP':
            log.debug('action HTTP');
            return httpService.doAction(action);
            break;
        case 'GridActionPredict':
            log.debug('action predict');
            predictionService.predict(i18nService.getTranslation(gridElement.label), action.dictionaryKey);
            break;
        case 'GridActionCollectElement':
            log.debug('action collect element');
            collectElementService.doCollectElementActions(action.action);
            break;
        case 'GridActionWebradio':
            webradioService.doAction(options.gridId, action);
            break;
        case 'GridActionYoutube':
            youtubeService.doAction(action);
            break;
        case 'GridActionChangeLang':
            let language = action.language;
            if (action.language === GridActionChangeLang.LAST_LANG) {
                language = localStorageService.getUserSettings().lastContentLang || i18nService.getContentLang();
            }
            await i18nService.setContentLanguage(language);
            let voiceConfig = localStorageService.getUserSettings().voiceConfig;
            voiceConfig.preferredVoice = action.voice;
            localStorageService.saveUserSettings({voiceConfig: voiceConfig});
            break;
        case 'GridActionOpenWebpage':
            let tab = window.open(action.openURL, '_blank');
            if (action.timeoutSeconds > 0) {
                setTimeout(() => {
                    tab.close();
                }, action.timeoutSeconds * 1000);
            }
            break;
        case 'GridActionUART':
            uartService.doAction(action);
            break;
        case 'GridActionSystem':
            systemActionService.doAction(action);
            break;
        case 'GridActionPredefined':
            return doPredefinedAction(gridElement, action);
            break;
    }
}

function doPredefinedAction(gridElement, action) {
    action = JSON.parse(JSON.stringify(action));
    for (let presetKey of Object.keys(action.actionInfo.presets || {})) {
        for(let customValue of action.actionInfo.customValues || []) {
            if (util.isString(action.actionInfo.presets[presetKey])) {
                let valueName = customValue.name;
                let replaceValue = action.customValues[valueName] !== undefined ? action.customValues[valueName] : '';
                let search = new RegExp(`\\$\\{${valueName}\\}`, 'g');
                action.actionInfo.presets[presetKey] = action.actionInfo.presets[presetKey].replace(search, replaceValue);
            }
        }
    }
    let newAction = GridElement.getActionInstance(action.actionInfo.actionModelName);
    if (newAction) {
        Object.assign(newAction, action.actionInfo.presets);
        return doAction(gridElement, newAction);
    }
}

function doAREAction(action, gridData) {
    if (!action.componentId) {
        return;
    }
    let modelBase64 = gridData.getAdditionalFile(action.areModelGridFileName).dataBase64;
    areService.uploadAndStartModel(modelBase64, action.areURL, action.areModelGridFileName).then(() => {
        if (action.dataPortId && action.dataPortSendData) {
            areService.sendDataToInputPort(
                action.componentId,
                action.dataPortId,
                action.dataPortSendData,
                action.areURL
            );
        }
        if (action.eventPortId) {
            areService.triggerEvent(action.componentId, action.eventPortId, action.areURL);
        }
    });
}

async function getMetadataConfig() {
    metadata = await dataService.getMetadata();
    minPauseSpeak = metadata.inputConfig.globalMinPauseCollectSpeak || 0;
}

async function getPredefinedInfos(url) {
    if (predefinedActionsData[url]) {
        return predefinedActionsData[url];
    }
    try {
        let response = await fetch(url);
        predefinedActionsData[url] = await response.json();
        predefinedActionsData[url].sort((a, b) => a.name.localeCompare(b.name));
        return predefinedActionsData[url];
    } catch (e) {
        log.warn(`failed to fetch predefined action/request infos.`);
        return [];
    }
}

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);
$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);

export { actionService };

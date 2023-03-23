import { areService } from "./areService";
import { openHABService } from "./openHABService";
import { dataService } from "./data/dataService";
import { speechService } from "./speechService";
import { collectElementService } from "./collectElementService";
import { predictionService } from "./predictionService";
import { Router } from "./../router";
import { GridElement } from "./../model/GridElement";
import { constants } from "../util/constants";
import { GridActionCollectElement } from "../model/GridActionCollectElement";
import { webradioService } from "./webradioService";
import { i18nService } from "./i18nService";
import { youtubeService } from "./youtubeService";
import { GridActionNavigate } from "../model/GridActionNavigate.js";
import { GridActionChangeLang } from "../model/GridActionChangeLang.js";
import $ from "../externals/jquery.js";
import { GridActionAudio } from "../model/GridActionAudio.js";
import { GridActionSpeak } from "../model/GridActionSpeak.js";
import { GridActionSpeakCustom } from "../model/GridActionSpeakCustom.js";

let actionService = {};

let minPauseSpeak = 0;

actionService.doAction = function (gridId, gridElementId) {
    if (!gridId || !gridElementId) {
        return;
    }
    dataService.getGridElement(gridId, gridElementId).then((gridElement) => {
        log.debug("do actions for: " + i18nService.getTranslation(gridElement.label) + ", " + gridElementId);
        switch (gridElement.type) {
            case GridElement.ELEMENT_TYPE_PREDICTION: {
                predictionService.doAction(gridElement.id);
                break;
            }
        }
        doActions(gridElement, gridId);
        $(window).trigger(constants.ELEMENT_EVENT_ID, [gridElement]);
    });
};

actionService.testAction = function (gridElement, action, gridData) {
    doAction(gridElement, action, {
        gridId: gridData.id,
        gridData: gridData
    });
};

function doActions(gridElement, gridId) {
    let actions = gridElement.actions;
    actions.sort((a, b) => {
        // do lang change before navigation
        if (a.modelName === GridActionChangeLang.getModelName() && b.modelName === GridActionNavigate.getModelName()) {
            return -1;
        }
        if (b.modelName === GridActionChangeLang.getModelName() && a.modelName === GridActionNavigate.getModelName()) {
            return 1;
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
    actions.forEach((action) => {
        doAction(gridElement, action, {
            gridId: gridId,
            actions: actions
        });
    });
}

/**
 *
 * @param gridElement
 * @param action
 * @param options.gridId the id of the grid the action is contained in (only needed for GridActionWebradio and GridActionARE)
 * @param options.gridData the gridData object the action is contained in (optional)
 * @param options.actions all actions that are currently executed
 */
async function doAction(gridElement, action, options) {
    options = options || {};
    options.actions = options.actions || [];

    switch (action.modelName) {
        case "GridActionSpeak":
            log.debug("action speak");
            speechService.speak(gridElement.label, {
                lang: action.speakLanguage,
                speakSecondary: true,
                minEqualPause: minPauseSpeak
            });
            break;
        case "GridActionSpeakCustom":
            log.debug("action speak custom");
            if (action.speakText) {
                speechService.speak(action.speakText, {
                    lang: action.speakLanguage,
                    speakSecondary: true,
                    minEqualPause: minPauseSpeak
                });
            }
            break;
        case "GridActionAudio":
            if (action.dataBase64) {
                audioUtil.stopAudio();
                audioUtil.playAudio(action.dataBase64);
            }
            break;
        case "GridActionNavigate":
            if (action.toLastGrid) {
                Router.toLastGrid();
            } else if (Router.isOnEditPage()) {
                Router.toEditGrid(action.toGridId);
            } else {
                Router.toGrid(action.toGridId);
            }
            break;
        case "GridActionARE":
            log.debug("action are");
            if (options.gridData) {
                doAREAction(action, options.gridData);
            } else {
                dataService.getGrid(options.gridId).then((grid) => {
                    doAREAction(action, grid);
                });
            }
            break;
        case "GridActionOpenHAB":
            log.debug("action openHAB");
            openHABService.sendAction(action);
            break;
        case "GridActionPredict":
            log.debug("action predict");
            predictionService.predict(i18nService.getTranslation(gridElement.label), action.dictionaryKey);
            break;
        case "GridActionCollectElement":
            log.debug("action collect element");
            collectElementService.doCollectElementActions(action.action);
            break;
        case "GridActionWebradio":
            webradioService.doAction(options.gridId, action);
            break;
        case "GridActionYoutube":
            youtubeService.doAction(action);
            break;
        case "GridActionChangeLang":
            await i18nService.setContentLanguage(action.language);
            if (
                options.actions.length === 0 ||
                !options.actions.map((a) => a.modelName).includes(GridActionNavigate.getModelName())
            ) {
                $(document).trigger(constants.EVENT_RELOAD_CURRENT_GRID);
            }
            let metadata = await dataService.getMetadata();
            metadata.localeConfig.preferredVoice = action.voice;
            await dataService.saveMetadata(metadata);
            break;
        case "GridActionOpenWebpage":
            let tab = window.open(action.openURL, "_blank");
            if (action.timeoutSeconds > 0) {
                setTimeout(() => {
                    tab.close();
                }, action.timeoutSeconds * 1000);
            }
            break;
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
    let metadata = await dataService.getMetadata();
    minPauseSpeak = metadata.inputConfig.globalMinPauseCollectSpeak || 0;
}

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);
$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);

export { actionService };

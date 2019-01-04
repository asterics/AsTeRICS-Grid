import {areService} from "./areService";
import {dataService} from "./data/dataService";
import {speechService} from "./speechService";
import {collectElementService} from "./collectElementService";
import {Router} from "./../router";
import {GridElement} from "./../model/GridElement";
import {constants} from "../util/constants";

var actionService = {};

actionService.doAction = function (gridId, gridElementId) {
    dataService.getGridElement(gridId, gridElementId).then(gridElement => {
        log.info('do actions for: ' + gridElement.label + ', ' + gridElementId);
        $(window).trigger(constants.ELEMENT_EVENT_ID, [gridElement]);
        switch(gridElement.type) {
            case GridElement.ELEMENT_TYPE_COLLECT: {
                collectElementService.doAction(gridElement.id);
                break;
            }
            default: {
                doActions(gridElement, gridId);
            }
        }
    });
};

actionService.testAction = function (gridElement, action, gridData) {
    doAction(gridElement, action, null, gridData);
};

function doActions(gridElement, gridId) {
    gridElement.actions.forEach(action => {
        doAction(gridElement, action, gridId);
    });
}

function doAction(gridElement, action, gridId, gridData) {
    switch (action.modelName) {
        case 'GridActionSpeak':
            log.debug('action speak');
            if(gridElement.label) {
                speechService.speak(gridElement.label, action.speakLanguage);
            }
            break;
        case 'GridActionSpeakCustom':
            log.debug('action speak custom');
            if(action.speakText) {
                speechService.speak(action.speakText, action.speakLanguage);
            }
            break;
        case 'GridActionNavigate':
            log.debug('action navigate');
            if(Router.isOnEditPage()) {
                Router.toEditGrid(action.toGridId);
            } else {
                Router.toGrid(action.toGridId);
            }
            break;
        case 'GridActionARE':
            log.debug('action are');
            if(gridData) {
                doAREAction(action, gridData)
            } else {
                dataService.getGrid(gridId).then(grid => {
                    doAREAction(action, grid);
                });
            }
            break;
    }
}

function doAREAction(action, gridData) {
    if(!action.componentId) {
        return;
    }
    let modelBase64 = gridData.getAdditionalFile(action.areModelGridFileName).dataBase64;
    areService.uploadAndStartModel(modelBase64, action.areURL, action.areModelGridFileName).then(() => {
        if(action.dataPortId && action.dataPortSendData) {
            areService.sendDataToInputPort(action.componentId, action.dataPortId, action.dataPortSendData, action.areURL);
        }
        if(action.eventPortId) {
            areService.triggerEvent(action.componentId, action.eventPortId, action.areURL);
        }
    });
}

export {actionService};
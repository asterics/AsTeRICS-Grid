import {dataService} from "./dataService";
import {speechService} from "./speechService";
import {Router} from "./../router";
import {GridElement} from "./../model/GridElement";

var actionService = {};
actionService.ELEMENT_EVENT_ID = "ELEMENT_EVENT_ID";

actionService.doAction = function (gridId, gridElementId) {
    dataService.getGridElement(gridId, gridElementId).then(gridElement => {
        log.info('do actions for: ' + gridElement.label + ', ' + gridElementId);
        switch(gridElement.type) {
            case GridElement.ELEMENT_TYPE_COLLECT: {
                var text = $(`#${gridElementId} textarea`)[0].value;
                speechService.speak(text);
                break;
            }
            default: {
                doActions(gridElement);
            }
        }
    });
};

actionService.testAction = function (gridElement, action) {
    doAction(gridElement, action);
};

function doActions(gridElement) {
    gridElement.actions.forEach(action => {
        doAction(gridElement, action);
    });
}

function doAction(gridElement, action) {
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
    }
}

export {actionService};
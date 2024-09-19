import { GridActionSystem } from '../model/GridActionSystem';
import { localStorageService } from './data/localStorageService';
import { util } from '../util/util';
import { dataService } from './data/dataService';
import $ from '../externals/jquery';
import { constants } from '../util/constants';
import { MainVue } from '../vue/mainVue';
import { i18nService } from './i18nService';
import { speechService } from './speechService';

let systemActionService = {};

systemActionService.doAction = async function(action) {
    let userSettings = localStorageService.getUserSettings();
    switch (action.action) {
        case GridActionSystem.actions.SYS_VOLUME_UP:
            userSettings.systemVolume = Math.min(userSettings.systemVolume + action.actionValue, 100);
            notifyVolume(userSettings.systemVolume);
            localStorageService.saveUserSettings(userSettings);
            break;
        case GridActionSystem.actions.SYS_VOLUME_DOWN:
            userSettings.systemVolume = Math.max(userSettings.systemVolume - action.actionValue, 0);
            notifyVolume(userSettings.systemVolume);
            localStorageService.saveUserSettings(userSettings);
            break;
        case GridActionSystem.actions.SYS_VOLUME_TOGGLE_MUTE:
            userSettings.systemVolumeMuted = !userSettings.systemVolumeMuted;
            notifyVolume(userSettings.systemVolumeMuted ? 0 : userSettings.systemVolume);
            localStorageService.saveUserSettings(userSettings);
            if(userSettings.systemVolumeMuted) {
                speechService.stopSpeaking();
            }
            break;
        case GridActionSystem.actions.SYS_ENTER_FULLSCREEN:
            await systemActionService.enterFullscreen();
            break;
        case GridActionSystem.actions.SYS_LEAVE_FULLSCREEN:
            await systemActionService.exitFullscreen();
            break;
    }
};

systemActionService.enterFullscreen = async function(dontSave) {
    util.openFullscreen();
    let metadata = await dataService.getMetadata();
    metadata.fullscreen = true;
    if (!dontSave) {
        await dataService.saveMetadata(metadata);
    }
    $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
}

systemActionService.exitFullscreen = async function() {
    if (!dataService.getCurrentUser()) {
        return;
    }
    util.closeFullscreen();
    let metadata = await dataService.getMetadata();
    if (metadata.fullscreen) {
        metadata.fullscreen = false;
        await dataService.saveMetadata(metadata);
    }
    setTimeout(() => {
        $(document).trigger(constants.EVENT_GRID_RESIZE);
    }, 200);
};

function notifyVolume(volume) {
    MainVue.setTooltip(i18nService.t('systemVolume', volume), {
        revertOnClose: true,
        timeout: 5000
    });
}

export { systemActionService };

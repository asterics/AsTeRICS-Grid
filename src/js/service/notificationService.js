import {dataService} from "./data/dataService.js";
import $ from "../externals/jquery.js";
import {constants} from "../util/constants.js";
import {MainVue} from "../vue/mainVue.js";

let notificationService = {};

let CHECK_INTERVAL = 2000;
let notificationConfig = null;

notificationService.init = function () {
    setInterval(notificationService.checkNotifications, CHECK_INTERVAL);
};

notificationService.checkNotifications = async function () {
    if (!notificationConfig) {
        return;
    }
    let currentTime = new Date().getTime();
    let lastBackup = notificationConfig.lastBackup || 0;
    let lastBackupNotification = notificationConfig.lastBackupNotification || 0;
    let notificationIntervalMs = notificationConfig.backupNotifyIntervalDays * 1000 // TODO: change to days - * 24 * 60 * 60 * 1000;

    if (notificationIntervalMs === 0) {
        return;
    }

    if (currentTime - lastBackup > notificationIntervalMs && currentTime - lastBackupNotification > notificationIntervalMs) {
        let gridUpdateTime = await dataService.getLastGridUpdateTime();
        if (lastBackup < gridUpdateTime) {
            notificationConfig.lastBackupNotification = new Date().getTime();
            saveNotificationConfig();
            MainVue.setTooltip('Please consider to download a backup of your configuration in order to be safe of not loosing your work.', {
                msgType: 'info',
                closeOnNavigate: false,
                actionLink: 'Download now',
                actionLinkFn: downloadConfig,
                actionLink2: "Stop remembering",
                actionLinkFn2: stopRemembering
            })
        }
    }
}

async function downloadConfig() {
    MainVue.clearTooltip();
    dataService.downloadBackupToFile();
    await dataService.markCurrentConfigAsBackedUp();
}

async function stopRemembering() {
    MainVue.clearTooltip();
    notificationConfig.backupNotifyIntervalDays = 0;
    saveNotificationConfig();
}

async function saveNotificationConfig() {
    let metadata = await dataService.getMetadata();
    metadata.notificationConfig = notificationConfig;
    await dataService.saveMetadata(metadata);
}

async function getMetadataConfig() {
    let metadata = await dataService.getMetadata();
    notificationConfig = metadata.notificationConfig;
}

$(document).on(constants.EVENT_USER_CHANGED, getMetadataConfig);
$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);

export {notificationService};
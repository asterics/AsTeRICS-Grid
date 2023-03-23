import { dataService } from "./data/dataService.js";
import $ from "../externals/jquery.js";
import { constants } from "../util/constants.js";
import { MainVue } from "../vue/mainVue.js";
import { i18nService } from "./i18nService.js";

let notificationService = {};

let INIT_WAIT_TIME = 60 * 1000; //60s
let CHECK_INTERVAL = 60 * 60 * 1000; //60min
let notificationConfig = null;
let timeoutHandlerInit = null;
let timeoutHandlerCheck = null;

notificationService.init = function () {
    clearTimeout(timeoutHandlerInit);
    clearTimeout(timeoutHandlerCheck);
    timeoutHandlerInit = setTimeout(() => {
        checkNotificationAndSetTimer();
    }, INIT_WAIT_TIME);
};

notificationService.checkNotifications = async function () {
    if (!notificationConfig) {
        return;
    }
    let currentTime = new Date().getTime();
    let lastBackup = notificationConfig.lastBackup || 0;
    let lastBackupNotification = notificationConfig.lastBackupNotification || 0;
    let notificationIntervalMs = notificationConfig.backupNotifyIntervalDays * 24 * 60 * 60 * 1000;

    if (notificationIntervalMs === 0) {
        return;
    }

    if (
        currentTime - lastBackup > notificationIntervalMs &&
        currentTime - lastBackupNotification > notificationIntervalMs
    ) {
        let gridUpdateTime = await dataService.getLastGridUpdateTime();
        if (gridUpdateTime === undefined) {
            // no grids existing
            return;
        }
        if (lastBackup < gridUpdateTime || (lastBackup === 0 && gridUpdateTime === 0)) {
            notificationConfig.lastBackupNotification = new Date().getTime();
            saveNotificationConfig();
            MainVue.setTooltip(i18nService.t("pleaseConsiderToDownloadABackup"), {
                msgType: "info",
                closeOnNavigate: false,
                actionLink: i18nService.t("downloadNow"),
                actionLinkFn: downloadConfig,
                actionLink2: i18nService.t("stopRemembering"),
                actionLinkFn2: stopRemembering
            });
        }
    }
};

function checkNotificationAndSetTimer() {
    notificationService.checkNotifications();
    timeoutHandlerCheck = setTimeout(checkNotificationAndSetTimer, CHECK_INTERVAL);
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
$(document).on(constants.EVENT_USER_CHANGED, notificationService.init);
$(document).on(constants.EVENT_METADATA_UPDATED, getMetadataConfig);

export { notificationService };

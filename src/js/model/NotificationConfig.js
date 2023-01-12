import {Model} from "../externals/objectmodel";
import {constants} from "../util/constants";

class NotificationConfig extends Model({
    modelName: String,
    modelVersion: String,
    backupNotifyIntervalDays: [Number],
    lastBackupNotification: [Number],
    lastBackup: [Number]
}) {
    constructor(properties) {
        super(properties);
    }

    static getModelName() {
        return "NotificationConfig";
    }
}

NotificationConfig.defaults({
    modelName: NotificationConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    backupNotifyIntervalDays: 14,
    lastBackupNotification: 0,
    lastBackup: 0
});

export {NotificationConfig};
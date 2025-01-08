import { util } from '../../../js/util/util';
import { dataService } from '../../../js/service/data/dataService';
import { localStorageService } from '../../../js/service/data/localStorageService';
import { i18nService } from '../../../js/service/i18nService';

let SAVE_TIMEOUT_MS = 300;

let settingsSaveMixin = {
    methods: {
        saveMetadata(metadata) {
            this.$emit("changing");
            util.debounce(async () => {
                log.warn("save!")
                await dataService.saveMetadata(metadata);
                this.$emit("changed");
            }, SAVE_TIMEOUT_MS, 'SAVE_METADATA');
        },
        saveAppSettings(appSettings) {
            this.$emit("changing");
            return new Promise(resolve => {
                util.debounce(async () => {
                    await i18nService.setAppLanguage(appSettings.appLang, true);
                    localStorageService.saveAppSettings(appSettings);
                    this.$emit('changed');
                    resolve(true);
                }, SAVE_TIMEOUT_MS, 'SAVE_APP_SETTINGS');
                setTimeout(() => {
                    resolve(false);
                }, SAVE_TIMEOUT_MS + 100);
            });
        },
        async saveUserSettingsLocal(userSettingsLocal, timeout) {
            timeout = timeout === undefined ? SAVE_TIMEOUT_MS : timeout;
            this.$emit("changing");
            await i18nService.setContentLanguage(userSettingsLocal.contentLang, true);
            localStorageService.saveUserSettings(userSettingsLocal);
            setTimeout(() => {
                this.$emit("changed");
            }, timeout);
        }
    }
};

export { settingsSaveMixin };
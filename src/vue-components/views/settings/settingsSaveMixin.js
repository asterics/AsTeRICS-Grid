import { util } from '../../../js/util/util';
import { dataService } from '../../../js/service/data/dataService';
import { localStorageService } from '../../../js/service/data/localStorageService';
import { i18nService } from '../../../js/service/i18nService';

let settingsSaveMixin = {
    methods: {
        saveMetadata(metadata) {
            this.$emit("changing");
            util.debounce(async () => {
                log.warn("save!")
                await dataService.saveMetadata(metadata);
                this.$emit("changed");
            }, 300, 'SAVE_METADATA');
        },
        saveAppSettings(appSettings, postFn) {
            this.$emit("changing");
            util.debounce(async () => {
                await i18nService.setAppLanguage(appSettings.appLang, true);
                localStorageService.saveAppSettings(appSettings);
                if (postFn) {
                    postFn();
                }
                this.$emit("changed");
            }, 300, 'SAVE_APP_SETTINGS');
        },
        async saveUserSettingsLocal(userSettingsLocal, dontSaveSettings) {
            this.$emit("changing");
            await i18nService.setContentLanguage(userSettingsLocal.contentLang, true);
            this.selectVoices = this.getSelectVoices();
            this.fixCurrentVoice(true);
            this.setVoiceTestText();
            if (!dontSaveSettings) {
                localStorageService.saveUserSettings(userSettingsLocal);
            }
            this.$emit("changed");
        }
    }
};

export { settingsSaveMixin };
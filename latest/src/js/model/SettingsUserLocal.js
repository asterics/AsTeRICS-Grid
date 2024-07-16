import { convertServiceLocal } from '../service/data/convertServiceLocal.js';
import {VoiceConfig} from "./VoiceConfig.js";

class SettingsUserLocal {

    /**
     * @param settings.modelVersion current model version string for local storage models
     * @param settings.modelVersionDb current model version string for database models
     * @param settings.contentLang
     * @param settings.username
     * @param settings.password
     * @param settings.metadata
     * @param settings.ytState
     * @param settings.voiceConfig
     * @param settings.originGridsetFilename
     * @param settings.isEmpty true if this user configuration is empty
     */
    constructor(settings) {
        settings = settings || {};
        this.modelVersion = settings.modelVersion;

        this.modelVersionDb = settings.modelVersionDb;
        this.contentLang = settings.contentLang;
        this.username = settings.username;
        this.password = settings.password;
        this.metadata = settings.metadata;
        this.ytState = settings.ytState;
        this.voiceConfig = settings.voiceConfig && Object.keys(settings.voiceConfig).length ? new VoiceConfig(settings.voiceConfig) : {};
        this.originGridsetFilename = settings.originGridsetFilename;
        this.isEmpty = settings.isEmpty !== undefined ? settings.isEmpty : true;

        convertServiceLocal.updateDataModel(this);
    }
}

export { SettingsUserLocal };
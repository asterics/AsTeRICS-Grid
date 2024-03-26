import { convertServiceLocal } from '../service/data/convertServiceLocal.js';
import {VoiceConfig} from "./VoiceConfig.js";

class SettingsUserLocal {

    /**
     * @param settings.modelVersion current model version string for local storage models
     * @param settings.modelVersionDb current model version string for database models
     * @param settings.username
     * @param settings.password
     * @param settings.metadata
     * @param settings.ytState
     * @param settings.voiceConfig
     */
    constructor(settings) {
        settings = settings || {};
        this.modelVersion = settings.modelVersion;

        this.modelVersionDb = settings.modelVersionDb;
        this.username = settings.username;
        this.password = settings.password;
        this.metadata = settings.metadata;
        this.ytState = settings.ytState;
        this.voiceConfig = settings.voiceConfig ? new VoiceConfig(settings.voiceConfig) : undefined;

        convertServiceLocal.updateDataModel(this);
    }
}

export { SettingsUserLocal };
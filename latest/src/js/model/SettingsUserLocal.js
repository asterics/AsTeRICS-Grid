import { convertServiceLocal } from '../service/data/convertServiceLocal.js';
import {VoiceConfig} from "./VoiceConfig.js";
import { GridActionYoutube } from './GridActionYoutube';

let initYtState = {
    lastPlayType: GridActionYoutube.playTypes.YT_PLAY_PLAYLIST,
    lastData: 'https://www.youtube.com/watch?v=5ffLB4a9APc&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz',
    lastVideoId: null,
    lastTimes: {}, // Video ID -> Player Time
    lastPlaylistIndexes: {}, // Playlist ID -> last played video index
    dataApiCalls: {},
    muted: false,
    volume: 100
};

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
     * @param settings.systemVolume
     * @param settings.systemVolumeMuted
     */
    constructor(settings) {
        settings = settings || {};
        this.modelVersion = settings.modelVersion;

        this.modelVersionDb = settings.modelVersionDb;
        this.contentLang = settings.contentLang;
        this.username = settings.username;
        this.password = settings.password;
        this.metadata = settings.metadata;
        this.ytState = settings.ytState || JSON.parse(JSON.stringify(initYtState));
        this.voiceConfig = settings.voiceConfig && Object.keys(settings.voiceConfig).length ? new VoiceConfig(settings.voiceConfig) : {};
        this.originGridsetFilename = settings.originGridsetFilename;
        this.isEmpty = settings.isEmpty !== undefined ? settings.isEmpty : true;
        this.systemVolume = settings.systemVolume !== undefined ? settings.systemVolume : 100;
        this.systemVolumeMuted = settings.systemVolumeMuted || false;

        convertServiceLocal.updateDataModel(this);
    }
}

export { SettingsUserLocal };
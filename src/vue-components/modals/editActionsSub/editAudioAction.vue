<template>
    <div>
        <div class="row">
            <div class="col-12 col-md-4">
                <span>{{ $t('currentRecording') }}</span>:
            </div>
            <div class="col-12 col-md-4" v-if="recording">
                {{ i18nService.t('recordingSeconds', (recordTimeMs / 1000).toFixed(1)) }}
            </div>
            <div class="col-12 col-md-4" v-if="!action.dataBase64 && !recording">
                (none)
            </div>
            <div class="col-12 col-md-4" v-if="action.dataBase64 && action.durationMs">
                {{ i18nService.t('audioWithLengthOfSeconds', (action.durationMs / 1000).toFixed(1)) }}
            </div>
            <div class="col-12 col-md-4" v-if="action.dataBase64 && action.filename">
                {{ i18nService.t('audioFromFileWithName', action.filename) }}
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12 col-md-8 offset-md-4">
                <div class="row">
                    <div class="col-12 col-md">
                        <button class="col-12" @click="toggleRecord()" :disabled="playing">
                            <span v-if="!recording"><span class="fas fa-microphone"/> <span>{{ $t('record') }}</span></span>
                            <span v-if="recording"><span class="fas fa-microphone-slash"/> <span>{{ $t('stopRecording') }}</span></span>
                        </button>
                    </div>
                    <div class="col-12 col-md">
                        <button onclick="document.getElementById('inputFile').click();" class="file-input col-12">
                            <input type="file" class="five columns" id="inputFile" @change="changedFile" accept="audio/*"/>
                            <span><i class="fas fa-file-upload"/> <span>{{ $t('chooseFile') }}</span></span>
                        </button>
                    </div>
                    <div class="col-12 col-md">
                        <button class="col-12" @click="togglePlaying()" :disabled="recording || !action.dataBase64">
                            <span v-if="!playing"><span class="fas fa-play"/> <span>{{ $t('play') }}</span></span>
                            <span v-if="playing"><span class="fas fa-stop"/> <span>{{ $t('stop') }}</span></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-3" v-if="showError">
            <span class="col-12 col-md-8 offset-md-4">
                <span class="fas fa-exclamation-triangle"/> <span>{{ $t('pleaseAllowAccessingMicrophoneInOrderToRecordAudio') }}</span>.
            </span>
        </div>
        <div class="row mt-3" v-if="showError2">
            <span class="col-12 col-md-8 offset-md-4">
                <span class="fas fa-exclamation-triangle"/> <span>{{ $t('selectedAudioFileIsTooBig') }}</span>.
            </span>
        </div>
        <div class="row mt-3" v-if="globalHasContinuousSpeakAction">
            <span class="col-12 col-md-8 offset-md-4">
                <span class="fas fa-info-circle"/> <span>{{ $t('recordedAudioIsOnlyPlayedWithCollectElementActions') }}</span>. <a href="javascript:;" @click="setModePlaySeparately">{{ $t('setActionsOfGlobalGridToModeSpeakSeparately') }}</a>
            </span>
        </div>
        <div class="row mt-3" v-if="updatedGlobalSpeakActions">
            <span class="col-12 col-md-8 offset-md-4">
                <span class="fas fa-check"/> <span>{{ $t('speakActionsOfGlobalGridWereSetToModeModeSpeak') }}</span>. <a href="javascript:;" @click="undoSetModePlaySeparately">{{ $t('undo') }}</a>
            </span>
        </div>
    </div>
</template>

<script>
import {audioUtil} from "../../../js/util/audioUtil.js";
import {i18nService} from "../../../js/service/i18nService.js";
import {dataService} from "../../../js/service/data/dataService.js";
import {GridActionCollectElement} from "../../../js/model/GridActionCollectElement.js";
import { imageUtil } from '../../../js/util/imageUtil';

const MAX_RECORD_TIME = 10000;

export default {
    props: ['action', 'gridData'],
    data: function () {
        return {
            audioUtil: audioUtil,
            recordTimeMs: 0,
            recording: false,
            playing: false,
            intervalHandler: null,
            showError: null,
            showError2: null,
            i18nService: i18nService,
            globalGrid: null,
            originalGlobalGrid: null,
            updatedGlobalSpeakActions: false
        }
    },
    computed: {
        globalHasContinuousSpeakAction() {
            if (!this.globalGrid) {
                return false;
            }
            for (let element of this.globalGrid.gridElements) {
                for (let action of element.actions) {
                    if (action.modelName === GridActionCollectElement.getModelName()) {
                        if ([GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS, GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR].includes(action.action)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    },
    methods: {
        changedFile() {
            let thiz = this;
            imageUtil.getBase64FromInput($('#inputFile')[0]).then(base64 => {
                if (base64.length > 250000) {
                    this.showError2 = true;
                    return;
                }
                this.clearAll();
                thiz.action.dataBase64 = imageUtil.dataStringToBase64(base64)
                thiz.action.filename = $('#inputFile')[0].files[0].name;
                thiz.$forceUpdate();
            });
        },
        toggleRecord() {
            if (this.recording) {
                this.stopRecording();
            } else {
                this.record();
            }
        },
        togglePlaying() {
            if (this.playing) {
                this.stopPlaying();
            } else {
                this.play();
            }
        },
        async record() {
            this.clearAll();
            try {
                await audioUtil.record(data => {
                    this.action.dataBase64 = data.base64;
                    this.action.mimeType = data.mimeType;
                    this.action.durationMs = this.recordTimeMs;
                    this.$forceUpdate();
                });
            } catch (e) {
                this.showError = true;
                return;
            }
            this.recording = true;
            this.recordTimeMs = 0;
            this.intervalHandler = setInterval(() => {
                this.recordTimeMs += 100;
                if (this.recordTimeMs === MAX_RECORD_TIME) {
                    this.stopRecording();
                }
            }, 100);
        },
        setModePlaySeparately() {
            for (let element of this.globalGrid.gridElements) {
                for (let action of element.actions) {
                    if (action.modelName === GridActionCollectElement.getModelName()) {
                        if (action.action === GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS) {
                            action.action = GridActionCollectElement.COLLECT_ACTION_SPEAK;
                        }
                        if (action.action === GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR) {
                            action.action = GridActionCollectElement.COLLECT_ACTION_SPEAK_CLEAR;
                        }
                    }
                }
            }
            dataService.saveGrid(this.globalGrid);
            this.updatedGlobalSpeakActions = true;
        },
        undoSetModePlaySeparately() {
            this.globalGrid = JSON.parse(JSON.stringify(this.originalGlobalGrid));
            dataService.saveGrid(this.globalGrid);
            this.updatedGlobalSpeakActions = false;
        },
        stopRecording() {
            this.recording = false;
            clearInterval(this.intervalHandler);
            audioUtil.stopRecording();
        },
        play() {
            this.playing = true;
            audioUtil.playAudio(this.action.dataBase64, {
                onended: () => {
                    this.playing = false;
                }
            });
        },
        stopPlaying() {
            this.playing = false;
            audioUtil.stopAudio();
        },
        clearAll() {
            this.showError = false;
            this.showError2 = false;
            this.action.dataBase64 = '';
            this.action.filename = '';
            this.action.durationMs = null;
            this.action.mimeType = '';
        }
    },
    async mounted () {
        this.globalGrid = JSON.parse(JSON.stringify(await dataService.getGlobalGrid()));
        this.originalGlobalGrid = JSON.parse(JSON.stringify(this.globalGrid));
    },
    beforeDestroy() {
    }
}
</script>

<style scoped>
</style>
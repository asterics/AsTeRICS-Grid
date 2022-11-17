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
            <div class="col-12 col-md-4" v-if="action.dataBase64 && !recording">
                {{ i18nService.t('audioWithLengthOfSeconds', (action.durationMs / 1000).toFixed(1)) }}
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-6 col-md-3 offset-md-4">
                <button class="col-12" @click="toggleRecord()" :disabled="playing">
                    <span v-if="!recording"><span class="fas fa-microphone"/> <span>{{ $t('record') }}</span></span>
                    <span v-if="recording"><span class="fas fa-microphone-slash"/> <span>{{ $t('stopRecording') }}</span></span>
                </button>
            </div>
            <div class="col-6 col-md-3">
                <button class="col-12" @click="togglePlaying()" :disabled="recording">
                    <span v-if="!playing"><span class="fas fa-play"/> <span>{{ $t('play') }}</span></span>
                    <span v-if="playing"><span class="fas fa-stop"/> <span>{{ $t('stop') }}</span></span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import './../../../css/modal.css';
import {audioUtil} from "../../../js/util/audioUtil.js";
import {i18nService} from "../../../js/service/i18nService.js";

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
            i18nService: i18nService
        }
    },
    methods: {
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
        record() {
            this.recording = true;
            this.recordTimeMs = 0;
            audioUtil.record(data => {
                this.action.dataBase64 = data.base64;
                this.action.mimeType = data.mimeType;
                this.action.durationMs = this.recordTimeMs;
                this.$forceUpdate();
            });
            this.intervalHandler = setInterval(() => {
                this.recordTimeMs += 100;
                if (this.recordTimeMs === MAX_RECORD_TIME) {
                    this.stopRecording();
                }
            }, 100);
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
        }
    },
    mounted () {
    },
    beforeDestroy() {
    }
}
</script>

<style scoped>
</style>
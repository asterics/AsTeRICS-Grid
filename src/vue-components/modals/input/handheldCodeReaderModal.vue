<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keydown.27="cancel()" @keydown.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="cancel()"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 name="header">{{ $t('handheldCodeReader') }}</h1>
                    </div>

                    <div class="modal-body" v-if="inputConfig">
                        <div class="srow">
                            <span>{{ $t('handheldCodeReaderDescription') }}</span>
                        </div>
                        <div class="srow">
                            <div class="twelve columns">
                                <input v-focus type="checkbox" id="enableHandheldCodeReader" v-model="inputConfig.handheldCodeReaderEnabled"/>
                                <label class="inline" for="enableHandheldCodeReader">{{ $t('enableHandheldCodeReader') }}</label>
                            </div>
                        </div>
                        <div v-show="inputConfig.handheldCodeReaderEnabled">
                            <div class="srow" v-if="cameraError">
                                <div class="twelve columns warn"><i class="fas fa-exclamation-triangle"></i> {{ cameraError }}</div>
                            </div>
                            <div class="srow" v-if="!cameraError && videoDevices.length">
                                <label for="handheldCameraSelect">{{ $t('handheldCodeReaderCamera') }}</label>
                                <select id="handheldCameraSelect" v-model="inputConfig.handheldCodeReaderDeviceId" class="u-full-width">
                                    <option value="">{{ $t('handheldCodeReaderDefaultCamera') }}</option>
                                    <option v-for="d in videoDevices" :key="d.deviceId" :value="d.deviceId">{{ d.label || d.deviceId }}</option>
                                </select>
                            </div>
                            <div class="srow">
                                <div class="twelve columns">
                                    <input type="checkbox" id="handheldPreview" v-model="inputConfig.handheldCodeReaderPreview"/>
                                    <label for="handheldPreview">{{ $t('handheldCodeReaderShowPreview') }}</label>
                                </div>
                            </div>
                            <div class="srow">
                                <slider-input
                                    :label="$t('handheldCodeReaderLockMs')"
                                    id="handheldLockMs"
                                    min="100"
                                    max="10000"
                                    step="100"
                                    decimals="0"
                                    default="2000"
                                    v-model.number="inputConfig.handheldCodeReaderLockMs"
                                />
                            </div>
                            <div class="warn" v-show="error">
                                <i class="fas fa-exclamation-triangle"></i> {{ error }}
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
                            <button @click="cancel()" class="four columns offset-by-four">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button @click="save()" class="four columns">
                                <i class="fas fa-check"/> <span>{{ $t('ok') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { dataService } from '../../../js/service/data/dataService';
    import { helpService } from '../../../js/service/helpService';
    import { i18nService } from '../../../js/service/i18nService';
    import { BrowserCodeReader } from '@zxing/browser';
    import SliderInput from './sliderInput.vue';
    import './../../../css/modal.css';
    import { inputEventHandler } from '../../../js/input/inputEventHandler';

    export default {
        components: { SliderInput },
        data() {
            return {
                inputConfig: null,
                metadata: null,
                error: '',
                cameraError: '',
                videoDevices: []
            };
        },
        methods: {
            save() {
                if (!this.validateInputs()) {
                    return;
                }
                this.metadata.inputConfig = this.inputConfig;
                dataService.saveMetadata(this.metadata).then(() => {
                    this.$emit('close');
                });
            },
            cancel() {
                this.$emit('close');
            },
            openHelp() {
                helpService.openHelp();
            },
            validateInputs() {
                this.error = '';
                if (!this.inputConfig.handheldCodeReaderEnabled) {
                    return true;
                }
                let lock = Number(this.inputConfig.handheldCodeReaderLockMs);
                if (isNaN(lock) || lock < 100) {
                    this.error = i18nService.t('handheldCodeReaderInvalidLock');
                    return false;
                }
                return true;
            },
            async loadVideoDevices() {
                this.cameraError = '';
                if (!window.isSecureContext) {
                    this.cameraError = i18nService.t('handheldCodeReaderNeedsHttps');
                    return;
                }
                if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                    this.cameraError = i18nService.t('handheldCodeReaderApiUnavailable');
                    return;
                }
                let stream = null;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                } catch (e) {
                    if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                        this.cameraError = i18nService.t('handheldCodeReaderPermissionDenied');
                    } else {
                        this.cameraError = i18nService.t('handheldCodeReaderPermissionDenied');
                    }
                    return;
                }
                try {
                    let devices = await BrowserCodeReader.listVideoInputDevices();
                    this.videoDevices = devices || [];
                } catch (e) {
                    log.warn('handheldCodeReader listVideoInputDevices: ' + e);
                    this.cameraError = i18nService.t('handheldCodeReaderEnumerateFailed');
                } finally {
                    if (stream) {
                        stream.getTracks().forEach((t) => t.stop());
                    }
                }
            }
        },
        mounted() {
            inputEventHandler.pauseAll();
            let thiz = this;
            dataService.getMetadata().then((metadata) => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.inputConfig = JSON.parse(JSON.stringify(metadata.inputConfig));
                thiz.loadVideoDevices();
            });
            helpService.setHelpLocation('04_input_options', '#handheld-code-reader');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
            inputEventHandler.resumeAll();
        }
    };
</script>

<style scoped>
    .warn {
        margin-top: 1em;
        color: #a60;
    }
</style>

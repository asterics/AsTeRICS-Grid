<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keydown.27="cancel()" @keydown.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="cancel()"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 name="header">{{ $t('codeReaderInput') }}</h1>
                    </div>

                    <div class="modal-body" v-if="inputConfig">
                        <div class="srow">
                            <div class="twelve columns">
                                <span>{{ $t('codeReaderInputDescription') }}</span>
                            </div>
                        </div>
                        <div class="srow">
                            <div class="twelve columns">
                                <input v-focus type="checkbox" id="enableCodeReader" v-model="inputConfig.codeReaderEnabled"/>
                                <label class="inline" for="enableCodeReader">{{ $t('enableCodeReader') }}</label>
                            </div>
                        </div>

                        <div class="srow" v-show="inputConfig.codeReaderEnabled && supported">
                            <label class="four columns" for="codeReaderCameraSelect">{{ $t('codeReaderCamera') }}</label>
                            <select id="codeReaderCameraSelect" class="eight columns" v-model="selectedDeviceId">
                                <option v-for="(cam, index) in cameras" :key="cam.deviceId || index" :value="cam.deviceId">
                                    {{ cam.label || $t('codeReaderCameraFallbackName', [index + 1]) }}
                                </option>
                            </select>
                            <div class="twelve columns">
                                <span class="cr-hint">{{ $t('codeReaderCameraPermissionHint') }}</span>
                            </div>
                        </div>

                        <fieldset class="srow" v-show="inputConfig.codeReaderEnabled">
                            <legend class="four columns">{{ $t('codeReaderMatching') }}</legend>
                            <div class="eight columns">
                                <div>
                                    <input type="radio" id="matchIdAndLabel" :value="InputConfig.CODE_READER_MATCH_ID_AND_LABEL" v-model="inputConfig.codeReaderMatchMode"/>
                                    <label class="inline" for="matchIdAndLabel">{{ $t('codeReaderMatchIdAndLabel') }}</label>
                                </div>
                                <div>
                                    <input type="radio" id="matchId" :value="InputConfig.CODE_READER_MATCH_ID" v-model="inputConfig.codeReaderMatchMode"/>
                                    <label class="inline" for="matchId">{{ $t('codeReaderMatchId') }}</label>
                                </div>
                                <div>
                                    <input type="radio" id="matchLabel" :value="InputConfig.CODE_READER_MATCH_LABEL" v-model="inputConfig.codeReaderMatchMode"/>
                                    <label class="inline" for="matchLabel">{{ $t('codeReaderMatchLabel') }}</label>
                                </div>
                            </div>
                        </fieldset>

                        <accordion v-show="inputConfig.codeReaderEnabled" :acc-label="$t('ADVANCED_SETTINGS')" acc-label-type="h2" acc-background-color="white">
                            <fieldset class="srow">
                                <legend class="four columns">{{ $t('codeReaderFormats') }}</legend>
                                <div class="eight columns">
                                    <div>
                                        <input type="checkbox" id="formatDataMatrix" :checked="hasFormat(InputConfig.CODE_READER_FORMAT_DATA_MATRIX)" @change="toggleFormat(InputConfig.CODE_READER_FORMAT_DATA_MATRIX)"/>
                                        <label class="inline" for="formatDataMatrix">{{ $t('codeReaderFormatDataMatrix') }}</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" id="formatQrCode" :checked="hasFormat(InputConfig.CODE_READER_FORMAT_QR_CODE)" @change="toggleFormat(InputConfig.CODE_READER_FORMAT_QR_CODE)"/>
                                        <label class="inline" for="formatQrCode">{{ $t('codeReaderFormatQrCode') }}</label>
                                    </div>
                                    <div>
                                        <input type="checkbox" id="formatAztec" :checked="hasFormat(InputConfig.CODE_READER_FORMAT_AZTEC)" @change="toggleFormat(InputConfig.CODE_READER_FORMAT_AZTEC)"/>
                                        <label class="inline" for="formatAztec">{{ $t('codeReaderFormatAztec') }}</label>
                                    </div>
                                </div>
                            </fieldset>
                            <div class="srow">
                                <label class="four columns" for="codeReaderCooldown">{{ $t('codeReaderCooldown') }}</label>
                                <input type="range" id="codeReaderCooldownRange" v-model.number="inputConfig.codeReaderCooldownMs" min="300" max="5000" step="100"/>
                                <input type="number" id="codeReaderCooldown" v-model.number="inputConfig.codeReaderCooldownMs" min="300" max="5000" step="100"/>
                            </div>
                        </accordion>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
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
    import {dataService} from '../../../js/service/data/dataService'
    import {helpService} from "../../../js/service/helpService";
    import {localStorageService} from "../../../js/service/data/localStorageService";
    import {handheldCodeReaderService} from "../../../js/service/handheldCodeReaderService";
    import Accordion from "../../components/accordion.vue"
    import './../../../css/modal.css';
    import {InputConfig} from "../../../js/model/InputConfig";

    export default {
        props: [],
        components: {Accordion},
        data: function () {
            return {
                inputConfig: null,
                metadata: null,
                supported: false,
                cameras: [],
                selectedDeviceId: null,
                InputConfig: InputConfig
            }
        },
        methods: {
            async loadCameras() {
                try {
                    this.cameras = await handheldCodeReaderService.listCameras();
                } catch (error) {
                    this.cameras = [];
                    return;
                }
                let ids = this.cameras.map((cam) => cam.deviceId);
                if (!this.selectedDeviceId || !ids.includes(this.selectedDeviceId)) {
                    this.selectedDeviceId = this.cameras.length > 0 ? this.cameras[0].deviceId : null;
                }
            },
            async requestCameraPermission() {
                try {
                    // shows the browser permission prompt; afterwards real device names are available
                    this.cameras = await handheldCodeReaderService.requestPermission();
                    let ids = this.cameras.map((cam) => cam.deviceId);
                    if (!this.selectedDeviceId || !ids.includes(this.selectedDeviceId)) {
                        this.selectedDeviceId = this.cameras.length > 0 ? this.cameras[0].deviceId : null;
                    }
                } catch (error) {
                    // permission denied or no camera: the configuration is still saved,
                    // the bar shows a clear message when the user tries to start
                }
            },
            hasFormat(format) {
                return Array.isArray(this.inputConfig.codeReaderFormats) && this.inputConfig.codeReaderFormats.includes(format);
            },
            toggleFormat(format) {
                let formats = Array.isArray(this.inputConfig.codeReaderFormats) ? this.inputConfig.codeReaderFormats.slice() : [];
                if (formats.includes(format)) {
                    formats = formats.filter((f) => f !== format);
                } else {
                    formats.push(format);
                }
                this.inputConfig.codeReaderFormats = formats;
            },
            async save() {
                if (this.inputConfig.codeReaderEnabled && this.supported) {
                    await this.requestCameraPermission();
                }
                localStorageService.saveUserSettings({ lastCodeReaderCameraId: this.selectedDeviceId || null });
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
            }
        },
        mounted() {
            let thiz = this;
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                let inputConfig = JSON.parse(JSON.stringify(metadata.inputConfig));
                // fall back to defaults for configurations saved before the code reader existed
                inputConfig.codeReaderEnabled = inputConfig.codeReaderEnabled || false;
                inputConfig.codeReaderFormats = inputConfig.codeReaderFormats || InputConfig.DEFAULT_CODE_READER_FORMATS.slice();
                inputConfig.codeReaderMatchMode = inputConfig.codeReaderMatchMode || InputConfig.CODE_READER_MATCH_ID_AND_LABEL;
                inputConfig.codeReaderCooldownMs = inputConfig.codeReaderCooldownMs || 1500;
                thiz.inputConfig = inputConfig;
            });
            this.supported = handheldCodeReaderService.isSupported();
            let settings = localStorageService.getUserSettings();
            this.selectedDeviceId = settings ? settings.lastCodeReaderCameraId || null : null;
            if (this.supported) {
                // labels are only filled once permission was granted before; otherwise generic names show
                this.loadCameras();
            }
            helpService.setHelpLocation('04_input_options', '#handheld-code-reader');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    fieldset {
        border: 1px solid #cccccc;
        padding: 0.5em 1em;
        margin-bottom: 1em;
    }

    legend {
        padding: 0 0.5em;
    }

    .cr-hint {
        display: inline-block;
        margin-top: 0.3em;
        color: #555555;
        font-size: 0.9em;
    }
</style>

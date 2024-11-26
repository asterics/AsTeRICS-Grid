<template>
    <base-modal icon="fas fa-sort-amount-down" :title="$t('scanning')" @open="init" @keydown.enter="save" @ok="save" v-on="$listeners">
                    <template #default v-if="inputConfig">
                        <div class="srow">
                            <span>{{ $t('scanningInputMethod12InputEvents') }}</span>
                            <a :aria-label="$t('help')" href="javascript:;" @click="openHelp()"><i class="fas blue fa-question-circle"></i></a>
                        </div>
                        <div class="srow" >
                            <div class="twelve columns">
                                <input type="checkbox" id="enableScanning" v-model="inputConfig.scanEnabled"/>
                                <label class="inline" for="enableScanning">{{ $t('enableScanning') }}</label>
                            </div>
                        </div>
                        <div v-show="inputConfig.scanEnabled">
                            <accordion :acc-label="$t('input')" acc-open="true" acc-label-type="h2" acc-background-color="white" class="srow">
                                <input-event-list v-model="inputConfig.scanInputs" :input-labels="[InputConfig.SELECT, InputConfig.NEXT]" :error-inputs="errorInputs" @input="inputChanged"></input-event-list>
                                <div class="srow">
                                    <button class="twelve columns" @click="resetInput">{{ $t('resetToDefaultInputConfiguration') }}</button>
                                </div>
                            </accordion>
                            <accordion :acc-label="$t('ADVANCED_SETTINGS')" acc-label-type="h2" acc-background-color="white">
                                <div class="srow" style="margin-top: 0">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkVerticalScanning" v-model="inputConfig.scanVertical"/>
                                        <label for="chkVerticalScanning">{{ $t('verticalScanning') }}</label>
                                    </div>
                                </div>
                                <div class="srow">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkBinaryScanning" v-model="inputConfig.scanBinary"/>
                                        <label for="chkBinaryScanning">{{ $t('binaryScanning') }}</label>
                                    </div>
                                </div>
                                <div class="srow">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkStartWithAction" v-model="inputConfig.scanStartWithAction"/>
                                        <label for="chkStartWithAction">{{ $t('startManuallyByUserInputEvent') }}</label>
                                    </div>
                                </div>
                                <div class="srow">
                                    <slider-input :label="$t('roundsUntilGoingBack')" id="roundsUntilBack" min="1" max="10" step="1" decimals="0" default="3" v-model.number="inputConfig.scanRoundsUntilBack"/>
                                </div>
                                <div class="srow">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkAutoScanning" v-model="inputConfig.scanAuto"/>
                                        <label for="chkAutoScanning">{{ $t('automaticTimedScanning') }}</label>
                                    </div>
                                </div>
                                <div class="srow" v-show="inputConfig.scanAuto">
                                    <slider-input :label="$t('scanningTimeMs')" id="inScanTime" min="100" max="10000" step="100" decimals="0" v-model.number="inputConfig.scanTimeoutMs"/>
                                </div>
                                <div class="srow" v-show="inputConfig.scanAuto">
                                    <slider-input :label="$t('timeFactorFirstElement')" id="inFirstElement" min="1" max="5" step="0.1" decimals="1" v-model.number="inputConfig.scanTimeoutFirstElementFactor"/>
                                </div>
                            </accordion>
                            <accordion :acc-label="$t('generalInputSettings')" acc-label-type="h2" acc-background-color="white">
                                <global-input-options :input-config="inputConfig"/>
                            </accordion>
                            <accordion :acc-label="$t('TEST_CONFIGURATION')" acc-label-type="h2" acc-background-color="white" @open="testOpen = true; initTest()" @close="testOpen = false; stopTest()">
                                <test-area :selected-element="selectedTestElement"></test-area>
                            </accordion>
                            <div class="warn" v-show="error">
                                <i class="fas fa-exclamation-triangle"></i> {{error}}
                            </div>
                        </div>
                    </template>
    </base-modal>
</template>

<script>
    import {dataService} from '../../../js/service/data/dataService'
    import {helpService} from "../../../js/service/helpService";
    import {i18nService} from "../../../js/service/i18nService";
    import Accordion from "../../components/accordion.vue"
    import InputEventList from "../../components/inputEventList.vue"
    import TestArea from "./testArea.vue"
    import {modalMixin} from "../../mixins/modalMixin";
    import {InputConfig} from "../../../js/model/InputConfig";
    import {Scanner} from "../../../js/input/scanning";
    import {inputEventHandler} from "../../../js/input/inputEventHandler";
    import GlobalInputOptions from "./globalInputOptions.vue";
    import SliderInput from "./sliderInput.vue";

    export default {
        components: {GlobalInputOptions, Accordion, InputEventList, TestArea, SliderInput},
        mixins: [modalMixin],
        data: function () {
            return {
                inputConfig: null,
                touchScanning: null,
                metadata: null,
                InputConfig: InputConfig,
                error: '',
                errorInputs: [],
                scanner: null,
                testOpen: false,
                selectedTestElement: null
            }
        },
        watch: {
            inputConfig: {
                handler: function(newConfig) {
                    if (this.testOpen) {
                        this.initTest(newConfig);
                    }
                },
                deep: true
            }
        },
        methods: {
            save() {
                if (!this.validateInputs()) {
                    return;
                }
                this.metadata.inputConfig = this.inputConfig;
                dataService.saveMetadata(this.metadata).then(() => {
                    this.$emit('close');
                    this.closeModal();
                });
            },
            openHelp() {
                helpService.openHelp();
            },
            validateInputs() {
                this.errorInputs = [];
                this.error = "";
                if (!this.inputConfig.scanEnabled) {
                    return true;
                }
                if (this.inputConfig.scanInputs.filter(input => input.label === InputConfig.SELECT).length === 0) {
                    this.errorInputs.push(InputConfig.SELECT);
                }
                if (this.inputConfig.scanInputs.filter(input => input.label === InputConfig.NEXT).length === 0 && !this.inputConfig.scanAuto) {
                    this.errorInputs.push(InputConfig.NEXT);
                }

                if (this.errorInputs.length > 0) {
                    this.error = i18nService.t('pleaseSpecifyInputModalities');
                    return false;
                }
                return true;
            },
            inputChanged() {
                if (this.error) {
                    this.validateInputs();
                }
            },
            resetInput() {
                this.$set(this.inputConfig, 'scanInputs', JSON.parse(JSON.stringify(InputConfig.DEFAULT_SCAN_INPUTS)));
                this.inputChanged();
            },
            initTest() {
                setTimeout(() => {
                    this.stopTest();
                    if (this.inputConfig.scanEnabled) {
                        this.scanner = Scanner.getInstanceFromConfig(this.inputConfig, '.area-element-inner', 'active', 'inactive');
                        this.scanner.setSelectionListener(element => {
                            this.selectedTestElement = element;
                        });
                        this.scanner.startScanning();
                    }
                }, 100);
            },
            stopTest() {
                if (this.scanner) {
                    this.scanner.destroy();
                }
            },
        init() {
            let thiz = this;
            inputEventHandler.pauseAll();
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.inputConfig = JSON.parse(JSON.stringify(metadata.inputConfig));
                thiz.touchScanning = !thiz.inputConfig.mouseclickEnabled;
            });
            helpService.setHelpLocation('04_input_options', '#scanning');
        },
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
            this.stopTest();
            inputEventHandler.resumeAll();
        }
    }
</script>

<style scoped>
    .warn {
        margin-top: 2em;
    }

    .slidergroup input {
        width: 50%;
    }
</style>
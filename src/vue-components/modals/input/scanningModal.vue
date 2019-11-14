<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keydown.27="cancel()" @keydown.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="cancel()"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 name="header">
                            Scanning
                        </h1>
                    </div>

                    <div class="modal-body" v-if="inputConfig">
                        <div class="row">
                            <span data-i18n="">Scanning input method: 1-2 input events // Eingabemethode Scanning: 1-2 Eingabekanäle</span>
                            <a aria-label="Help" href="javascript:;" @click="openHelp()"><i class="fas blue fa-question-circle"></i></a>
                        </div>
                        <div class="row" >
                            <div class="twelve columns">
                                <input v-focus type="checkbox" id="enableScanning" v-model="inputConfig.scanEnabled"/>
                                <label class="inline" for="enableScanning" data-i18n>Enable Scanning // Scanning aktivieren</label>
                            </div>
                        </div>
                        <div v-show="inputConfig.scanEnabled">
                            <accordion acc-label="Input // Eingabe" acc-open="true" acc-label-type="h2" acc-background-color="white" class="row">
                                <input-event-list v-model="inputConfig.scanInputs" :input-labels="[InputConfig.SELECT, InputConfig.NEXT]" :error-inputs="errorInputs" @input="inputChanged"></input-event-list>
                                <div class="row">
                                    <button class="twelve columns" data-i18n="" @click="resetInput">Reset to default input configuration // Auf Standard Eingabe-Konfiguration zurücksetzen</button>
                                </div>
                            </accordion>
                            <accordion acc-label="ADVANCED_SETTINGS" acc-label-type="h2" acc-background-color="white">
                                <div class="row" style="margin-top: 0">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkVerticalScanning" v-model="inputConfig.scanVertical"/>
                                        <label for="chkVerticalScanning" data-i18n>Vertical scanning // Scanning vertikal</label>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkBinaryScanning" v-model="inputConfig.scanBinary"/>
                                        <label for="chkBinaryScanning" data-i18n>Binary scanning // Scanning binär</label>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkTouchScanning" v-model="touchScanning" @change="changeTouchScanning"/>
                                        <label for="chkTouchScanning" data-i18n>Scanning-selection by mouse click or tap // Scanning-Auswahl durch Mausklick oder tippen</label>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkAutoScanning" v-model="inputConfig.scanAuto"/>
                                        <label for="chkAutoScanning" data-i18n>Automatic (timed) scanning // Automatisches (zeitgesteuertes) Scanning</label>
                                    </div>
                                </div>
                                <div class="row" v-show="inputConfig.scanAuto">
                                    <label class="four columns" for="inScanTime" data-i18n>Scanning Time (ms) // Scanning Zeit (ms)</label>
                                    <input type="range" id="inScanTime" v-model.number="inputConfig.scanTimeoutMs" min="100" max="3000" step="100"/>
                                    <input type="number" v-model.number="inputConfig.scanTimeoutMs" min="100" max="3000" step="100"/>
                                </div>
                                <div class="row" v-show="inputConfig.scanAuto">
                                    <label class="four columns" for="inFirstElement" data-i18n>Time factor first element // Zeit-Faktor erstes Element</label>
                                    <input type="range" id="inFirstElement" v-model.number="inputConfig.scanTimeoutFirstElementFactor" min="1" max="5" step="0.1"/>
                                    <input type="number" v-model.number="inputConfig.scanTimeoutFirstElementFactor" min="1" max="5" step="0.5" />
                                </div>
                            </accordion>
                            <accordion acc-label="TEST_CONFIGURATION" acc-label-type="h2" acc-background-color="white" @open="testOpen = true; initTest()" @close="testOpen = false; stopTest()">
                                <test-area :selected-element="selectedTestElement"></test-area>
                            </accordion>

                            <div class="warn" v-show="error">
                                <i class="fas fa-exclamation-triangle"></i> {{error}}
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
                            <button @click="cancel()" class="four columns offset-by-four">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button @click="save()" class="four columns">
                                <i class="fas fa-check"/> <span>OK</span>
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
    import {i18nService} from "../../../js/service/i18nService";
    import Accordion from "../../components/accordion.vue"
    import InputEventList from "../../components/inputEventList.vue"
    import TestArea from "./testArea.vue"
    import './../../../css/modal.css';
    import {InputConfig} from "../../../js/model/InputConfig";
    import {Scanner} from "../../../js/input/scanning";
    import {inputEventHandler} from "../../../js/input/inputEventHandler";

    export default {
        props: [],
        components: {Accordion, InputEventList, TestArea},
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
                });
            },
            cancel() {
                this.$emit('close');
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
                    this.error = i18nService.translate('Please specify input modalities // Bitte Eingabemodalitäten definieren');
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
            changeTouchScanning() {
                this.inputConfig.mouseclickEnabled = !this.touchScanning;
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
            }
        },
        mounted () {
            let thiz = this;
            inputEventHandler.pauseAll();
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.inputConfig = JSON.parse(JSON.stringify(metadata.inputConfig));
                thiz.touchScanning = !thiz.inputConfig.mouseclickEnabled;
            });
            helpService.setHelpLocation('04_input_options', '#scanning');
        },
        updated() {
            i18nService.initDomI18n();
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
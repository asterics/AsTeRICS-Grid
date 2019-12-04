<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keydown.27="cancel()" @keydown.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="cancel()"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n="">Huffman Input // Huffman-Eingabe</h1>
                    </div>

                    <div class="modal-body" v-if="inputConfig">
                        <div class="row">
                            <span data-i18n="">Huffman input method: 2 or more input events // Huffman-Eingabe: 2 oder mehr Eingabekanäle</span>
                            <a aria-label="Help" href="javascript:;" @click="openHelp()"><i class="fas blue fa-question-circle"></i></a>
                        </div>
                        <div class="row" >
                            <div class="twelve columns">
                                <input v-focus type="checkbox" id="enableHuffinput" v-model="inputConfig.huffEnabled"/>
                                <label class="inline" for="enableHuffinput" data-i18n>Enable huffman input // Huffman-Eingabe aktivieren</label>
                            </div>
                        </div>
                        <div v-show="inputConfig.huffEnabled">
                            <accordion acc-label="Input // Eingabe" acc-open="true" acc-label-type="h2" acc-background-color="white" class="row">
                                <input-event-list v-model="inputConfig.huffInputs" :min-inputs="2" :max-inputs="9" :error-inputs="errorInputs" @input="inputChanged"></input-event-list>
                                <div class="row">
                                    <button class="twelve columns" data-i18n="" @click="resetInput">Reset to default input configuration // Auf Standard Eingabe-Konfiguration zurücksetzen</button>
                                </div>
                            </accordion>
                            <accordion acc-label="ADVANCED_SETTINGS" acc-label-type="h2" acc-background-color="white">
                                <div class="row" style="margin-top: 0">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkNumbers" v-model="inputConfig.huffShowNumbers"/>
                                        <label for="chkNumbers" data-i18n>Show numbers // Zeige Nummern</label>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkColors" v-model="inputConfig.huffShowColors"/>
                                        <label for="chkColors" data-i18n>Show colors // Zeige Farben</label>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkColorWholeElement" v-model="inputConfig.huffColorWholeElement"/>
                                        <label for="chkColorWholeElement" data-i18n>Color whole element // Färbe ganzes Element</label>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkMarkInactive" v-model="inputConfig.huffMarkInactive"/>
                                        <label for="chkMarkInactive" data-i18n>Mark inactive elements // Markiere inaktive Elemente</label>
                                    </div>
                                </div>
                                <div class="row">
                                    <label class="four columns" for="inTimeout" data-i18n="">Timeout in ms (0 means disabled) // Timeout in ms (0 ist deaktiviert)</label>
                                    <input type="range" id="inTimeout" v-model.number="inputConfig.huffTimeout" min="0" max="10000" step="100"/>
                                    <input type="number" v-model.number="inputConfig.huffTimeout" min="0" max="10000" step="200" />
                                </div>
                                <div class="row">
                                    <label for="inElementCount" class="four columns" data-i18n>Number of elements (0 means automatic) // Anzahl der Elemente (0 ist automatisch)</label>
                                    <input type="range" min="0" max="300" id="inElementCount" v-model.number="inputConfig.huffElementCount"/>
                                    <input type="number" min="0" max="300" id="inElementCount2" v-model.number="inputConfig.huffElementCount"/>
                                </div>
                                <div class="row">
                                    <div class="four columns">
                                        <div v-for="i in inputConfig.huffInputs.length">
                                            <label :for="'colorInput' + i" style="margin-right: 1em"><span data-i18n="">Color // Farbe</span> {{i}}</label>
                                            <input :id="'colorInput' + i" type="color" v-model="inputConfig.huffColors[i-1]"/>
                                        </div>
                                    </div>
                                    <button @click="inputConfig.huffColors = JSON.parse(JSON.stringify(InputConfig.DEFAULT_HUFF_COLORS))" class="four columns" style="margin-top: 1em" data-i18n="">Reset colors // Farben zurücksetzen</button>
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
    import {HuffmanInput} from "../../../js/input/huffmanInput";
    import {inputEventHandler} from "../../../js/input/inputEventHandler";

    export default {
        props: [],
        components: {Accordion, InputEventList, TestArea},
        data: function () {
            return {
                inputConfig: null,
                metadata: null,
                InputConfig: InputConfig,
                error: '',
                errorInputs: [],
                huffInput: null,
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
                this.inputConfig.huffElementCount = this.inputConfig.huffElementCount || 0;
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
                if (!this.inputConfig.huffEnabled) {
                    return true;
                }
                if (this.inputConfig.huffInputs.length < 2) {
                    this.errorInputs.push(InputConfig.GENERAL_INPUT);
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
                this.$set(this.inputConfig, 'huffInputs', JSON.parse(JSON.stringify(InputConfig.DEFAULT_HUFF_INPUTS)));
                this.inputChanged();
            },
            initTest() {
                setTimeout(() => {
                    let thiz = this;
                    thiz.stopTest();
                    if (thiz.inputConfig.huffEnabled) {
                        this.huffInput = HuffmanInput.getInstanceFromConfig(this.inputConfig, '.area-element-inner', 'active', 'inactive', (item) => {
                            this.selectedTestElement = item;
                        });
                        this.huffInput.start();
                    }
                }, 100);
            },
            stopTest() {
                if (this.huffInput) {
                    this.huffInput.destroy();
                }
            }
        },
        mounted () {
            let thiz = this;
            inputEventHandler.pauseAll();
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.inputConfig = JSON.parse(JSON.stringify(metadata.inputConfig));
            });
            helpService.setHelpLocation('04_input_options', '#huffman-input');
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
</style>
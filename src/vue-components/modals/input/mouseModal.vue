<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="cancel()" @keyup.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="cancel()"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n="">Mouse input // Mauseingabe</h1>
                    </div>

                    <div class="modal-body" v-if="inputConfig">
                        <div class="row" >
                            <div class="twelve columns">
                                <input v-focus type="checkbox" id="enableClick" v-model="inputConfig.mouseclickEnabled"/>
                                <label class="inline" for="enableClick" data-i18n>Select with mouse click // Auswahl mit Mausklick</label>
                            </div>
                        </div>
                        <div class="row" >
                            <div class="twelve columns">
                                <input v-focus type="checkbox" id="enableHover" v-model="inputConfig.hoverEnabled"/>
                                <label class="inline" for="enableHover" data-i18n>Enable hovering // Hovering aktivieren</label>
                            </div>
                        </div>
                        <div class="row" v-show="inputConfig.hoverEnabled">
                            <label class="four columns" for="inHoverTime" data-i18n>Hover Time (ms) // Hovering Zeit (ms)</label>
                            <input type="range" id="inHoverTime" v-model.number="inputConfig.hoverTimeoutMs" min="100" max="3000" step="100"/>
                            <input type="number" v-model.number="inputConfig.hoverTimeoutMs" min="100" max="3000" step="100"/>
                        </div>
                        <accordion class="row" acc-label="TEST_CONFIGURATION" acc-label-type="h2" acc-background-color="white" @open="testOpen = true; initTest()" @close="testOpen = false; stopTest()">
                            <test-area :selected-element="selectedTestElement"></test-area>
                        </accordion>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container">
                            <button @click="cancel()">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button @click="save()">
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
    import {Hover} from "../../../js/input/hovering";
    import {Clicker} from "../../../js/input/clicking";
    import {inputEventHandler} from "../../../js/input/inputEventHandler";

    export default {
        props: [],
        components: {Accordion, InputEventList, TestArea},
        data: function () {
            return {
                inputConfig: null,
                metadata: null,
                InputConfig: InputConfig,
                clicker: null,
                hover: null,
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
            initTest() {
                setTimeout(() => {
                    let thiz = this;
                    this.stopTest();
                    if (thiz.inputConfig.hoverEnabled) {
                        thiz.hover = new Hover('.area-element-inner', thiz.inputConfig.hoverTimeoutMs);
                        thiz.hover.setSelectionListener(function (item) {
                            thiz.selectedTestElement = item;
                        });
                        thiz.hover.startHovering();
                    }

                    if (thiz.inputConfig.mouseclickEnabled) {
                        thiz.clicker = new Clicker('.area-element-inner');
                        thiz.clicker.setSelectionListener(function (item) {
                            thiz.selectedTestElement = item;
                        });
                        thiz.clicker.startClickcontrol();
                    }
                }, 100);
            },
            stopTest() {
                if (this.clicker) {
                    this.clicker.destroy();
                }
                if (this.hover) {
                    this.hover.destroy();
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
            helpService.setHelpLocation('04_input_options', '#input-options');
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
</style>
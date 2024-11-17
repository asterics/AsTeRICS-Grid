<template>
    <modal :title="$t('mousetouchInput')" @ok="save" @close="cancel" :help-fn="openHelp">
        <template #default v-if="inputConfig">
            <div class="srow">
                <div class="twelve columns">
                    <input v-focus type="checkbox" id="enableClick" v-model="inputConfig.mouseclickEnabled"/>
                    <label class="inline" for="enableClick">{{ $t('selectWithMouseClickOrTap') }}</label>
                </div>
            </div>
            <div class="srow">
                <div class="twelve columns">
                    <input v-focus type="checkbox" id="enableDoubleClick" v-model="inputConfig.mouseDoubleClickEnabled"/>
                    <label class="inline" for="enableDoubleClick">{{ $t('selectWithDoubleClickOrDoubleTap') }}</label>
                </div>
            </div>
            <div class="srow" >
                <div class="twelve columns">
                    <input v-focus type="checkbox" id="enableHover" v-model="inputConfig.hoverEnabled"/>
                    <label class="inline" for="enableHover">{{ $t('enableHovering') }}</label>
                </div>
            </div>
            <div class="srow" v-show="inputConfig.hoverEnabled">
                <label class="four columns" for="inHoverTime">{{ $t('hoverTimeMs') }}</label>
                <input type="range" id="inHoverTime" v-model.number="inputConfig.hoverTimeoutMs" min="0" max="5000" step="100"/>
                <input type="number" v-model.number="inputConfig.hoverTimeoutMs" min="0" max="5000" step="100"/>
            </div>
            <div class="srow" v-show="inputConfig.hoverEnabled">
                <div class="twelve columns">
                    <input v-focus type="checkbox" id="hoverHideCursor" v-model="inputConfig.hoverHideCursor"/>
                    <label class="inline" for="hoverHideCursor">{{ $t('hideCursor') }}</label>
                </div>
                <div class="twelve columns">
                    <input type="checkbox" id="chkDisableHoverpane" v-model="inputConfig.hoverDisableHoverpane"/>
                    <label for="chkDisableHoverpane">{{ $t('disableHoverPane') }}</label>
                </div>
            </div>
            <div class="mb-4"></div>
            <accordion :acc-label="$t('ADVANCED_SETTINGS')" acc-label-type="h2" acc-background-color="white">
                <div class="srow">
                    <div class="twelve columns">
                        <input v-focus type="checkbox" id="mousedown" v-model="inputConfig.mouseDownInsteadClick"/>
                        <label class="inline" for="mousedown">{{ $t('directlySelectElementOnPressingMouseButton') }}</label>
                    </div>
                </div>
            </accordion>
            <accordion :acc-label="$t('generalInputSettings')" acc-label-type="h2" acc-background-color="white">
                <global-input-options :input-config="inputConfig"/>
            </accordion>
            <accordion :acc-label="$t('TEST_CONFIGURATION')" acc-label-type="h2" acc-background-color="white" @open="testOpen = true; initTest()" @close="testOpen = false; stopTest()">
                <test-area :selected-element="selectedTestElement"></test-area>
            </accordion>
        </template>
    </modal>
</template>

<script>
    import {dataService} from '../../../js/service/data/dataService'
    import {helpService} from "../../../js/service/helpService";
    import Accordion from "../../components/accordion.vue"
    import InputEventList from "../../components/inputEventList.vue"
    import TestArea from "./testArea.vue"
    import Modal from '../modal.vue';
    import { modalMixin } from '../../mixins/modalMixin.js';
    import {InputConfig} from "../../../js/model/InputConfig";
    import {Hover} from "../../../js/input/hovering";
    import {Clicker} from "../../../js/input/clicking";
    import {inputEventHandler} from "../../../js/input/inputEventHandler";
    import GlobalInputOptions from "./globalInputOptions.vue";

    export default {
        props: [],
        components: { GlobalInputOptions, Accordion, InputEventList, TestArea, Modal },
        mixins: [modalMixin],
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
                        thiz.hover = Hover.getInstanceFromConfig(thiz.inputConfig, '.area-element-inner', {
                            demoMode: true,
                            containerClass: '.area .area-row'
                        });
                        thiz.hover.setSelectionListener(function (item) {
                            thiz.selectedTestElement = item;
                        });
                        thiz.hover.startHovering();
                    }

                    if (thiz.inputConfig.mouseclickEnabled || thiz.inputConfig.mouseDoubleClickEnabled) {
                        thiz.clicker = Clicker.getInstanceFromConfig(thiz.inputConfig, '.area-element-inner');
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
            helpService.setHelpLocation('04_input_options', '#mousetouch-input');
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
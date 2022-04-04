<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keydown.27="cancel()" @keydown.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="cancel()"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 name="header">{{ $t('directionInput') }}</h1>
                    </div>

                    <div class="modal-body" v-if="inputConfig">
                        <div class="srow">
                            <span>{{ $t('directionInputMethod25InputEvents') }}</span>
                            <a :aria-label="$t('help')" href="javascript:;" @click="openHelp()"><i class="fas blue fa-question-circle"></i></a>
                        </div>
                        <div class="srow" >
                            <div class="twelve columns">
                                <input v-focus type="checkbox" id="enableDirinput" v-model="inputConfig.dirEnabled"/>
                                <label class="inline" for="enableDirinput">{{ $t('enableDirectionInput') }}</label>
                            </div>
                        </div>
                        <div v-show="inputConfig.dirEnabled">
                            <accordion :acc-label="$t('input')" acc-open="true" acc-label-type="h2" acc-background-color="white" class="srow">
                                <input-event-list v-model="inputConfig.dirInputs" :input-labels="[InputConfig.SELECT, InputConfig.RIGHT, InputConfig.DOWN, InputConfig.LEFT, InputConfig.UP]" :error-inputs="errorInputs" @input="inputChanged"></input-event-list>
                                <div class="srow">
                                    <button class="twelve columns" @click="resetInput">{{ $t('resetToDefaultInputConfiguration') }}</button>
                                </div>
                            </accordion>
                            <accordion :acc-label="$t('ADVANCED_SETTINGS')" acc-label-type="h2" acc-background-color="white">
                                <div class="srow" style="margin-top: 0">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkWrapAround" v-model="inputConfig.dirWrapAround"/>
                                        <label for="chkWrapAround">{{ $t('wrapAroundJumpToFirstElementAfterLastElem') }}</label>
                                    </div>
                                </div>
                                <div class="srow">
                                    <div class="twelve columns">
                                        <input type="checkbox" id="chkReset" v-model="inputConfig.dirResetToStart"/>
                                        <label for="chkReset">{{ $t('goToStartPositionAfterSelect') }}</label>
                                    </div>
                                </div>
                            </accordion>
                            <accordion :acc-label="$t('TEST_CONFIGURATION')" acc-label-type="h2" acc-background-color="white" @open="testOpen = true; initTest()" @close="testOpen = false; stopTest()">
                                <test-area :selected-element="selectedTestElement"></test-area>
                            </accordion>

                            <div class="warn" v-show="error">
                                <i class="fas fa-exclamation-triangle"></i> {{error}}
                            </div>
                        </div>
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
    import {i18nService} from "../../../js/service/i18nService";
    import Accordion from "../../components/accordion.vue"
    import InputEventList from "../../components/inputEventList.vue"
    import TestArea from "./testArea.vue"
    import './../../../css/modal.css';
    import {InputConfig} from "../../../js/model/InputConfig";
    import {DirectionInput} from "../../../js/input/directionInput";
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
                dirInput: null,
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
                if (!this.inputConfig.dirEnabled) {
                    return true;
                }
                if (this.inputConfig.dirInputs.filter(input => input.label === InputConfig.SELECT).length === 0) {
                    this.errorInputs.push(InputConfig.SELECT);
                }
                if (this.inputConfig.dirInputs.length < 2) {
                    this.errorInputs.push(InputConfig.RIGHT);
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
                this.$set(this.inputConfig, 'dirInputs', JSON.parse(JSON.stringify(InputConfig.DEFAULT_DIR_INPUTS)));
                this.inputChanged();
            },
            initTest() {
                setTimeout(() => {
                    let thiz = this;
                    thiz.stopTest();
                    if (thiz.inputConfig.dirEnabled) {
                        thiz.dirInput = DirectionInput.getInstanceFromConfig(thiz.inputConfig, '.area-element-inner', 'active', (item) => {
                            thiz.selectedTestElement = item;
                        });
                        thiz.dirInput.start();
                    }
                }, 100);
            },
            stopTest() {
                if (this.dirInput) {
                    this.dirInput.destroy();
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
            helpService.setHelpLocation('04_input_options', '#direction-input');
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
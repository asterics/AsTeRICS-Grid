<template>
    <div>
        <ul>
            <li v-for="(input, index) in inputs">
                <div class="row nomargin">
                    <span class="three columns input-label">{{input.label  | translate}}</span>
                    <select @change="typeChange(index, $event.target.value)" class="five columns">
                        <option value=""><span data-i18n="">not defined // nicht definiert</span></option>
                        <option v-for="inputEvent in inputEventTypes" :value="inputEvent.getModelName()" :selected="inputEvent.getModelName() === input.modelName">
                            {{inputEvent.getModelName() | translate}}
                        </option>
                    </select>
                    <span class="two columns" v-show="errorInputs.indexOf(input.label) > -1"><i class="warn fas fa-exclamation-triangle"></i></span>
                </div>
                <div v-if="input.modelName === InputEventKey.getModelName()">
                    <div class="row">
                        <button @click="recordKey(input)" class="five columns offset-by-three">
                            <i class="fas fa-keyboard"></i>
                            <span v-show="!keyRecording[input.label]" data-i18n="">Record key // Taste aufnehmen</span>
                            <span v-show="keyRecording[input.label]" data-i18n="">press key ... // Taste drücken ...</span>
                        </button>
                        <span class="four columns">
                            <b data-i18n="">Current key: // Aktuelle Taste:</b>
                            <span v-show="!input.keyCode" data-i18n="">(no key) // (keine Taste)</span>
                            <span v-show="input.keyCode">{{input.keyName + ' (' + input.keyCode + ')'}}</span>
                        </span>
                    </div>
                    <div class="row">
                        <accordion acc-label="more" class="nine columns offset-by-three">
                            <div class="row">
                                <label class="one-third column" :for="'inTimeout' + index">Timeout (ms)</label>
                                <input class="two-thirds column" :id="'inTimeout' + index" type="number" min="0" max="5000" step="100" v-model.number="input.timeout" @input="modelChanged"/>
                            </div>
                            <div class="row">
                                <label class="one-third column" :for="'inRepeat' + index" data-i18n="">Repetitions // Wiederholungen</label>
                                <input v-show="input.holdDuration === 0" class="two-thirds column" :id="'inRepeat' + index" type="number" min="1" max="9" v-model.number="input.repeat" @input="modelChanged"/>
                                <span v-show="input.holdDuration > 0" class="two-thirds column">
                                    <span data-i18n="">disabled if hold duration is set. // deaktiviert bei gesetzter Haltedauer.</span>
                                    <a href="javascript:;" @click="input.holdDuration = 0; modelChanged();" data-i18n="">Enable // Aktivieren</a>
                                </span>
                            </div>
                            <div class="row">
                                <label class="one-third column" :for="'inRepeat' + index" data-i18n="">Hold duration (ms) // Haltedauer (ms)</label>
                                <input v-show="input.repeat === 1" class="two-thirds column" :id="'inRepeat' + index" type="number" min="0" max="5000" step="100" v-model.number="input.holdDuration" :disabled="input.repeat > 1" @input="modelChanged"/>
                                <span v-show="input.repeat > 1" class="two-thirds column">
                                    <span data-i18n="">disabled if repetitions are set. // deaktiviert bei gesetzten Wiederholungen.</span>
                                    <a href="javascript:;" @click="input.repeat = 1; modelChanged();" data-i18n="">Enable // Aktivieren</a>
                                </span>
                            </div>
                        </accordion>
                    </div>
                </div>
                <div v-if="input.modelName === InputEventARE.getModelName()">
                    <div class="row" >
                        ARE
                    </div>
                </div>

            </li>
        </ul>
    </div>
</template>

<script>
    import Vue from 'vue';
    import {i18nService} from "../../js/service/i18nService";
    import {InputConfig} from "../../js/model/InputConfig";
    import {InputEventKey} from "../../js/model/InputEventKey";
    import {InputEventARE} from "../../js/model/InputEventARE";
    import {inputEventHandler} from "../../js/input/inputEventHandler";
    import Accordion from "./accordion.vue";

    export default {
        components: {Accordion},
        props: {
            value: Array,
            inputLabels: Array,
            canAdd: Boolean,
            maxElements: Number,
            errorInputs: Array
        },
        watch: {
            value: {
                handler: function (newValue) {
                    this.initWithValue(newValue);
                },
                deep: true
            }
        },
        data() {
            return {
                inputs: [],
                inputEventTypes: InputConfig.getInputEventTypes(),
                InputEventKey: InputEventKey,
                InputEventARE: InputEventARE,
                keyRecording: {},
                areRecording: {},
                lastEmitValue: null
            }
        },
        methods: {
            typeChange(elementIndex, type) {
                let currentElement = this.inputs[elementIndex];
                if (!type) {
                    currentElement.modelName = "";
                    this.modelChanged();
                    return;
                }
                let newElement = InputConfig.getInputEventInstance(type, {label: currentElement.label});
                Vue.set(this.inputs, elementIndex, JSON.parse(JSON.stringify(newElement)));
                this.modelChanged();
            },
            recordKey(input) {
                let thiz = this;
                Vue.set(thiz.keyRecording, input.label, true);

                let eventHandler = inputEventHandler.instance();
                eventHandler.onAnyKey((keyCode, keyName, event) => {
                    event.preventDefault();
                    eventHandler.destroy();
                    input.keyCode = keyCode;
                    input.keyName = keyName;
                    Vue.set(thiz.keyRecording, input.label, false);
                    thiz.modelChanged();
                });
                eventHandler.startListening();
            },
            modelChanged() {
                let passInputs = this.inputs.filter(input => {
                    if (!input.modelName) {
                        return false;
                    }
                    let instance = InputConfig.getInputEventInstance(input.modelName, input);
                    return instance.isValid();
                });
                let emitValue = JSON.parse(JSON.stringify(passInputs));
                if (JSON.stringify(emitValue) !== JSON.stringify(this.lastEmitValue)) {
                    this.$emit('input', emitValue);
                    this.lastEmitValue = emitValue;
                }
            },
            initWithValue(value) {
                let originalValue = JSON.parse(JSON.stringify(value));
                if (this.inputLabels) {
                    let existingLabels = originalValue.map(input => input.label);
                    let missingLabels = this.inputLabels.filter(label => existingLabels.indexOf(label) === -1);
                    missingLabels.forEach(label => {
                        let inputEvent = new InputEventARE({label: label});
                        inputEvent.modelName = "";
                        originalValue.push(inputEvent);
                    });
                    originalValue.sort((a, b) => this.inputLabels.indexOf(a.label) - this.inputLabels.indexOf(b.label));
                }
                if (originalValue instanceof Array) {
                    this.inputs = JSON.parse(JSON.stringify(originalValue));
                } else {
                    log.warn('parameter "value" must be an array of inputEvents.')
                }
            }
        },
        mounted() {
            let thiz = this;
            i18nService.initDomI18n();
            this.initWithValue(this.value);
        },
        updated() {
            i18nService.initDomI18n();
        }
    }
</script>

<style scoped>
    ul {
        list-style: none;
    }
    ul li:first-child {
        margin-top: 1em !important;
    }

    li {
        margin-bottom: 2em;
        margin-top: 2em;
    }
    .row.nomargin {
        margin: 0;
    }

    .input-label {
        font-weight: bold;
        margin-bottom: 0.7em;
    }

    @media (max-width: 850px) {
        li {
            outline: 1px solid lightgray;
            padding: 0.5em;
        }
    }
</style>
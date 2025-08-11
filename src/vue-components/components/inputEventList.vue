<template>
    <div>
        <ul>
            <li v-for="(input, index) in inputs">
                <div class="srow nomargin">
                    <label class="three columns input-label" :for="input.label + index">
                        <span>{{input.label  | translate}}</span>
                        <span v-show="input.label === InputConfig.GENERAL_INPUT">{{index + 1}}</span>
                    </label>
                    <select :id="input.label + index" @change="typeChange(index, $event.target.value)" class="five columns">
                        <option value=""><span>{{ $t('notDefined') }}</span></option>
                        <option v-for="inputEvent in inputEventTypes" :value="inputEvent.getModelName()" :selected="inputEvent.getModelName() === input.modelName">
                            {{inputEvent.getModelName() | translate}}
                        </option>
                    </select>
                    <span class="two columns" v-show="errorInputs.indexOf(input.label) > -1"><i class="warn fas fa-exclamation-triangle"></i></span>
                </div>
                <div v-if="input.modelName === InputEventKey.getModelName()">
                    <div class="srow">
                        <button @click="recordKey(input, index)" class="five columns offset-by-three">
                            <i class="fas fa-keyboard"></i>
                            <span v-show="!keyRecording[input.label+index]">{{ $t('recordKey') }}</span>
                            <span v-show="keyRecording[input.label+index]">{{ $t('pressKey') }}</span>
                        </button>
                        <span class="four columns">
                            <b>{{ $t('currentKey') }}</b>
                            <span v-show="!input.keyCode">{{ $t('noKey') }}</span>
                            <span v-show="input.keyCode && InputEventKey.SPECIAL_KEYS.includes(input.keyCode)">{{input.keyCode | translate}}</span>
                            <span v-show="input.keyCode && !InputEventKey.SPECIAL_KEYS.includes(input.keyCode)">{{input.keyName + ' (' + input.keyCode + ')'}}</span>
                        </span>
                    </div>
                    <div class="srow">
                        <accordion :acc-label="$t('more')" class="nine columns offset-by-three">
                            <div class="srow">
                                <label class="one-third column" :for="'inTimeout' + index">{{ $t('timeoutMs') }}</label>
                                <input class="two-thirds column" :id="'inTimeout' + index" type="number" min="0" max="5000" step="100" v-model.number="input.timeout" @input="modelChanged"/>
                            </div>
                            <div class="srow">
                                <label class="one-third column" :for="'inRepeat' + index">{{ $t('repetitions') }}</label>
                                <input v-show="input.holdDuration === 0" class="two-thirds column" :id="'inRepeat' + index" type="number" min="1" max="9" v-model.number="input.repeat" @input="modelChanged"/>
                                <span v-show="input.holdDuration > 0" class="two-thirds column">
                                    <span>{{ $t('disabledIfHoldDurationIsSet') }}</span>
                                    <a href="javascript:;" @click="input.holdDuration = 0; modelChanged();">{{ $t('enable') }}</a>
                                </span>
                            </div>
                            <div class="srow">
                                <label class="one-third column" :for="'inRepeat' + index">{{ $t('holdDurationMs') }}</label>
                                <input v-show="input.repeat === 1" class="two-thirds column" :id="'inRepeat' + index" type="number" min="0" max="5000" step="100" v-model.number="input.holdDuration" :disabled="input.repeat > 1" @input="modelChanged"/>
                                <span v-show="input.repeat > 1" class="two-thirds column">
                                    <span>{{ $t('disabledIfRepetitionsAreSet') }}</span>
                                    <a href="javascript:;" @click="input.repeat = 1; modelChanged();">{{ $t('enable') }}</a>
                                </span>
                            </div>
                        </accordion>
                    </div>
                </div>
                <div v-if="input.modelName === InputEventAudio.getModelName()">
                    <div class="srow">
                        <button @click="toggleMicRecording" class="five columns offset-by-three">
                            <span v-if="!micRecording"><span class="fas fa-microphone"/> <span>{{ $t('startListeningToMicrophone') }}</span></span>
                            <span v-if="micRecording"><span class="fas fa-microphone-slash"/> <span>{{ $t('stopListening') }}</span></span>
                        </button>
                    </div>
                    <div class="srow" v-if="micRecordError">
                        <span class="five columns offset-by-three">
                            <span class="fas fa-exclamation-triangle"/> <span>{{ $t('pleaseAllowAccessingMicrophoneInOrderToRecordAudio') }}</span>.
                        </span>
                    </div>
                    <div class="srow">
                        <div class="nine columns offset-by-three">
                            <h3 class="mt-0">{{ $t('volume') }}</h3>
                            <div>
                                <label :for="'volThresholdHigh' + index"><span class="sr-only">{{ $t('volume') }}</span>{{ $t('thresholdHigh') }}</label>
                            </div>
                            <div class="srow mb-4 mt-0">
                                <input class="eight columns" :id="'volThresholdHigh' + index" type="range" min="0.1" :max="getMicVolMaxRange(input)" step="0.1" v-model.number="input.volThresholdHigh" @input="validateChange(input, true); modelChanged();"/>
                                <span class="three columns">{{ input.volThresholdHigh.toFixed(1) }} %</span>
                            </div>
                            <div>
                                <label :for="'currentValue' + index"><span class="sr-only">{{ $t('volume') }}</span>{{ $t('currentValue') }}</label>
                            </div>
                            <div class="srow mb-4 mt-0" v-show="micRecording">
                                <input class="eight columns" :id="'currentValue' + index" type="range" min="0.1" :max="getMicVolMaxRange(input)" step="0.1" disabled v-model.number="micValues.volLive"/>
                                <span class="three columns">{{ (Math.round(micValues.volLive * 100) / 100).toFixed(1) }} %</span>
                            </div>
                            <div class="srow mb-4 mt-0" v-show="!micRecording">{{ $t('currentlyNotListeningToMicrophone') }}</div>
                            <div>
                                <label :for="'volThresholdLow' + index"><span class="sr-only">{{ $t('volume') }}</span>{{ $t('thresholdLow') }}</label>
                            </div>
                            <div class="srow mb-4 mt-0">
                                <input class="eight columns" :id="'volThresholdLow' + index" type="range" min="0.1" :max="getMicVolMaxRange(input)" step="0.1" v-model.number="input.volThresholdLow" @input="validateChange(input, false); modelChanged();"/>
                                <span class="three columns">{{ input.volThresholdLow.toFixed(1) }} %</span>
                            </div>
                        </div>
                    </div>
                    <div class="srow">
                        <div class="nine columns offset-by-three">
                            <h3 class="mt-0">{{ $t('frequency') }}</h3>
                            <div>
                                <label :for="'freqThresholdHigh' + index"><span class="sr-only">{{ $t('frequency') }}</span>{{ $t('thresholdHigh') }}</label>
                            </div>
                            <div class="srow mb-4 mt-0">
                                <input class="eight columns" :id="'freqThresholdHigh' + index" type="range" min="0" :max="getMicFreqMaxRange(input)" step="100" v-model.number="input.freqThresholdHigh" @input="validateChange(input, true); modelChanged();"/>
                                <span class="three columns">{{ input.freqThresholdHigh }} Hz</span>
                            </div>
                            <div>
                                <label :for="'currentValue' + index"><span class="sr-only">{{ $t('frequency') }}</span>{{ $t('currentValue') }}</label>
                            </div>
                            <div class="srow mb-4 mt-0" v-show="micRecording">
                                <input class="eight columns" :id="'currentValue' + index" type="range" min="0" :max="getMicFreqMaxRange(input)" step="100" disabled v-model.number="micValues.inputMaxFreqMap[input]"/>
                                <span class="three columns">{{ Math.round(micValues.inputMaxFreqMap[input]) }} Hz</span>
                            </div>
                            <div class="srow mb-4 mt-0" v-show="!micRecording">{{ $t('currentlyNotListeningToMicrophone') }}</div>
                            <div>
                                <label :for="'freqThresholdLow' + index"><span class="sr-only">{{ $t('frequency') }}</span>{{ $t('thresholdLow') }}</label>
                            </div>
                            <div class="srow mb-4 mt-0">
                                <input class="eight columns" :id="'freqThresholdLow' + index" type="range" min="0" :max="getMicFreqMaxRange(input)" step="100" v-model.number="input.freqThresholdLow" @input="validateChange(input, false); modelChanged();"/>
                                <span class="three columns">{{ input.freqThresholdLow }} Hz</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="input.modelName === InputEventARE.getModelName()">
                    <div class="srow">
                        <button @click="recordAREEvent(input, index)" class="five columns offset-by-three">
                            <i class="fas fa-bolt"></i>
                            <span v-show="!keyRecording[input.label+index]">{{ $t('recordAreEvent') }}</span>
                            <span v-show="keyRecording[input.label+index]">{{ $t('waitingForEvent') }}</span>
                        </button>
                        <label class="four columns" for="inputAreUrl">{{ $t('areUrl') }}</label>
                        <input class="four columns" id="inputAreUrl" type="text" v-model="input.areURL" :placeholder="$t('emptyIsAutomatic')" @change="changedAreURL(input)" @input="areError[input.label+index] = false"/>
                    </div>
                    <div class="srow">
                        <span class="nine columns offset-by-three" v-show="areError[input.label+index]">
                            <i class="fas fa-exclamation-triangle"></i>
                            {{ $t('errorConnectingToARE') }} {{'(' + areService.getRestURL(input.areURL) + ')'}}
                        </span>
                    </div>
                    <div class="srow">
                        <span v-for="(eventName, index) in input.eventNames" class="nine columns offset-by-three">
                            <b>{{ $t('event') }}</b> {{formatAreEvent(eventName)}} <button @click="removeAREEvent(input, index)" :title="$t('delete')" style="margin-left: 1em; padding: 0 0.5em"><i class="fas fa-trash"></i></button>
                        </span>
                    </div>
                </div>
                <div v-if="input.modelName === InputEventFace.getModelName()">
                    <div class="srow">
                        <div class="nine columns offset-by-three">
                            <h3 class="mt-0">{{$t('faceGesture')}}</h3>
                            <div class="srow">
                                <label class="one-third column" :for="'faceGestureType' + index">{{$t('gestureType')}}</label>
                                <select class="two-thirds column" :id="'faceGestureType' + index" v-model="input.gestureType" @change="modelChanged">
                                    <option value="BLINK_LEFT">{{$t('blinkLeft')}}</option>
                                    <option value="BLINK_RIGHT">{{$t('blinkRight')}}</option>
                                    <option value="BLINK_BOTH">{{$t('blinkBoth')}}</option>
                                    <option value="EYES_LEFT">{{$t('eyesLeft')}}</option>
                                    <option value="EYES_RIGHT">{{$t('eyesRight')}}</option>
                                    <option value="EYES_UP">{{$t('eyesUp')}}</option>
                                    <option value="EYES_DOWN">{{$t('eyesDown')}}</option>
                                    <option value="HEAD_TILT_LEFT">{{$t('headTiltLeft')}}</option>
                                    <option value="HEAD_TILT_RIGHT">{{$t('headTiltRight')}}</option>
                                    <option value="HEAD_LEFT">{{$t('headLeft')}}</option>
                                    <option value="HEAD_RIGHT">{{$t('headRight')}}</option>
                                    <option value="HEAD_UP">{{$t('headUp')}}</option>
                                    <option value="HEAD_DOWN">{{$t('headDown')}}</option>
                                    <option value="BROW_RAISE">{{$t('browRaise')}}</option>
                                    <option value="CHEEK_PUFF">{{$t('cheekPuff')}}</option>
                                    <option value="TONGUE_OUT">{{$t('tongueOut')}}</option>
                                    <option value="SMILE">{{$t('smile')}}</option>
                                    <option value="FROWN">{{$t('frown')}}</option>
                                    <option value="JAW_OPEN">{{$t('jawOpen')}}</option>
                                </select>
                            </div>
                            <div class="srow" v-if="['BLINK_LEFT','BLINK_RIGHT','BLINK_BOTH'].includes(input.gestureType)">
                                <label class="one-third column" :for="'blinkTh' + index">{{$t('blinkThreshold')}}</label>
                                <div class="two-thirds column srow">
                                    <input class="eight columns" :id="'blinkTh' + index" type="range" min="0.1" max="0.9" step="0.05" v-model.number="input.blinkScoreThreshold" @input="modelChanged"/>
                                    <span class="three columns">{{ input.blinkScoreThreshold.toFixed(2) }}</span>
                                </div>
                            </div>
                            <div class="srow" v-if="input.gestureType && input.gestureType.startsWith('EYES_')">
                                <label class="one-third column" :for="'gazeTh' + index">{{$t('gazeThreshold')}}</label>
                                <div class="two-thirds column srow">
                                    <input class="eight columns" :id="'gazeTh' + index" type="range" min="0.1" max="0.9" step="0.05" v-model.number="input.gazeScoreThreshold" @input="modelChanged"/>
                                    <span class="three columns">{{ input.gazeScoreThreshold.toFixed(2) }}</span>
                                </div>
                            </div>
                            <div class="srow" v-if="input.gestureType && input.gestureType.startsWith('HEAD_TILT')">
                                <label class="one-third column" :for="'tiltTh' + index">{{$t('headTiltDegThreshold')}}</label>
                                <div class="two-thirds column srow">
                                    <input class="eight columns" :id="'tiltTh' + index" type="range" min="5" max="35" step="1" v-model.number="input.headTiltDegThreshold" @input="modelChanged"/>
                                    <span class="three columns">{{ input.headTiltDegThreshold }}°</span>
                                </div>
                            </div>
                            <div class="srow" v-if="input.gestureType && input.gestureType.startsWith('HEAD_') && !input.gestureType.startsWith('HEAD_TILT')">
                                <label class="one-third column" :for="'moveTh' + index">{{$t('headMoveThreshold')}}</label>
                                <div class="two-thirds column srow">
                                    <input class="eight columns" :id="'moveTh' + index" type="range" min="0.05" max="0.5" step="0.01" v-model.number="input.headMoveNormThreshold" @input="modelChanged"/>
                                    <span class="three columns">{{ input.headMoveNormThreshold.toFixed(2) }}</span>
                                </div>
                            </div>
                            <div class="srow" v-if="['BROW_RAISE','CHEEK_PUFF','TONGUE_OUT','SMILE','FROWN','JAW_OPEN'].includes(input.gestureType)">
                                <label class="one-third column" :for="'gTh' + index">{{$t('gestureThreshold')}}</label>
                                <div class="two-thirds column srow">
                                    <input class="eight columns" :id="'gTh' + index" type="range" min="0.1" max="0.9" step="0.05" v-model.number="input.gazeScoreThreshold" @input="modelChanged"/>
                                    <span class="three columns">{{ input.gazeScoreThreshold.toFixed(2) }}</span>
                                </div>
                            </div>
                            <div class="srow">
                                <label class="one-third column" :for="'dwell' + index">{{$t('dwellMs')}}</label>
                                <div class="two-thirds column srow">
                                    <input class="eight columns" :id="'dwell' + index" type="number" min="0" max="2000" step="50" v-model.number="input.dwellMs" @input="modelChanged"/>
                                    <span class="three columns">{{ input.dwellMs }} ms</span>
                                </div>
                            </div>
                            <div class="srow">
                                <label class="one-third column" :for="'debounce' + index">{{$t('debounceMs')}}</label>
                                <div class="two-thirds column srow">
                                    <input class="eight columns" :id="'debounce' + index" type="number" min="0" max="2000" step="50" v-model.number="input.debounceMs" @input="modelChanged"/>
                                    <span class="three columns">{{ input.debounceMs }} ms</span>
                                </div>
                            </div>
                            <div class="srow">
                                <label class="one-third column" :for="'smooth' + index">{{$t('smoothing')}}</label>
                                <div class="two-thirds column srow">
                                    <input class="eight columns" :id="'smooth' + index" type="range" min="0" max="1" step="0.05" v-model.number="input.smoothingAlpha" @input="modelChanged"/>
                                    <span class="three columns">{{ input.smoothingAlpha.toFixed(2) }}</span>
                                </div>
                            </div>
                            <div class="srow">
                                <button class="five columns" @click="toggleFacePreview">
                                    <span v-if="!facePreview"><span class="fas fa-video"/> <span>{{$t('startCameraPreview')}}</span></span>
                                    <span v-else><span class="fas fa-video-slash"/> <span>{{$t('stopCameraPreview')}}</span></span>
                                </button>
                            </div>
                            <div class="srow" v-if="facePreview">
                                <face-mesh-preview></face-mesh-preview>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
    import Vue from 'vue';
    import {InputConfig} from "../../js/model/InputConfig";
    import {InputEventKey} from "../../js/model/InputEventKey";
    import {InputEventAudio} from "../../js/model/InputEventAudio";
    import {InputEventARE} from "../../js/model/InputEventARE";
import {InputEventFace} from "../../js/model/InputEventFace";
    import {inputEventHandler} from "../../js/input/inputEventHandler";
    import Accordion from "./accordion.vue";
    import {areService} from "../../js/service/areService";
    import {audioUtil} from "../../js/util/audioUtil.js";
import FaceMeshPreview from "./FaceMeshPreview.vue";
import { facelandmarkerService } from "../../js/service/facelandmarkerService";

    export default {
        components: {Accordion, FaceMeshPreview},
        props: {
            value: Array,
            inputLabels: Array,
            canAdd: Boolean,
            maxElements: Number,
            errorInputs: Array,
            minInputs: Number,
            maxInputs: Number
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
                InputEventAudio: InputEventAudio,
                InputEventARE: InputEventARE,
                InputEventFace: InputEventFace,
                InputConfig: InputConfig,
                keyRecording: {},
                areRecording: {},
                areError: {},
                micRecording: false,
                micRecordError: false,
                facePreview: false,
                micValues: {
                    volLive: 0,
                    volMax: 0,
                    inputMaxFreqMap: {}
                },
                lastEmitValue: null,
                localEventHandler: inputEventHandler.instance(),
                lastInitTime: null,
                areService: areService
            }
        },
        methods: {
            typeChange(elementIndex, type) {
                let currentElement = this.inputs[elementIndex];
                let emptyElements = this.inputs.filter(e => !e.modelName);
                if (!type) {
                    currentElement.modelName = "";
                    if (this.minInputs && this.inputs.length > this.minInputs && emptyElements.length >= 1) {
                        this.inputs.splice(elementIndex, 1);
                    }
                    this.modelChanged();
                    return;
                }
                let newElement = InputConfig.getInputEventInstance(type, {label: currentElement.label});
                Vue.set(this.inputs, elementIndex, JSON.parse(JSON.stringify(newElement)));
                if (this.maxInputs && this.inputs.length < this.maxInputs && emptyElements.length <= 1) {
                    this.addInput();
                }
                this.modelChanged();
            },
            recordKey(input, index) {
                let thiz = this;
                let recordingID = input.label + index;
                if (thiz.keyRecording[recordingID]) {
                    Vue.set(thiz.keyRecording, recordingID, false);
                    thiz.localEventHandler.destroy();
                    return;
                }

                Vue.set(thiz.keyRecording, recordingID, true);
                thiz.localEventHandler.destroy();
                thiz.localEventHandler = inputEventHandler.instance();
                thiz.localEventHandler.onAnyKey((keyCode, keyName, event) => {
                    event.preventDefault();
                    thiz.localEventHandler.destroy();
                    input.keyCode = keyCode;
                    input.keyName = keyName;
                    Object.assign(input, {
                        repeat: 1,
                        timeout: 0,
                        holdDuration: 0
                    });
                    Vue.set(thiz.keyRecording, recordingID, false);
                    thiz.modelChanged();
                });
                thiz.localEventHandler.startListening();
            },
            recordAREEvent(input, index) {
                let thiz = this;
                let recordingID = input.label + index;
                thiz.areError[recordingID] = false;
                if (thiz.keyRecording[recordingID]) {
                    endRecord();
                    return;
                }

                Vue.set(thiz.keyRecording, recordingID, true);
                areService.unsubscribeEvents();
                let timeoutHandler = null;
                areService.subscribeEvents(input.areURL, (data) => {
                    if (!timeoutHandler) {
                        timeoutHandler = setTimeout(() => {
                            Vue.set(thiz.keyRecording, recordingID, false);
                            areService.unsubscribeEvents();
                            thiz.modelChanged();
                        }, 1000);
                    }
                    input.eventNames.push(data);
                }, () => {
                    thiz.areError[recordingID] = true;
                    endRecord();
                });

                function endRecord() {
                    Vue.set(thiz.keyRecording, recordingID, false);
                    areService.unsubscribeEvents();
                }
            },
            removeAREEvent(input, index) {
                input.eventNames.splice(index, 1);
                this.modelChanged();
            },
            formatAreEvent(eventString) {
                let eventObject = JSON.parse(eventString);
                return eventObject.channelId + " -> " + eventObject.targetComponentId;
            },
            changedAreURL(input) {
                if (!input.areURL) {
                    return;
                }
                input.areURL = areService.getRestURL(input.areURL);
            },
            validateChange(input, highChanged) {
                if (input.volThresholdHigh < input.volThresholdLow) {
                    if (highChanged) {
                        input.volThresholdHigh = input.volThresholdLow;
                    } else {
                        input.volThresholdLow = input.volThresholdHigh;
                    }
                }
                if (input.freqThresholdHigh < input.freqThresholdLow) {
                    if (highChanged) {
                        input.freqThresholdHigh = input.freqThresholdLow;
                    } else {
                        input.freqThresholdLow = input.freqThresholdHigh;
                    }
                }
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
                    this.lastInitTime = new Date().getTime();
                    this.$emit('input', emitValue);
                    this.lastEmitValue = emitValue;
                }
            },
            addInput(count) {
                count = count || 1;
                for (let i = 0; i < count; i++) {
                    let newInput = JSON.parse(JSON.stringify(new InputEventKey({label: InputConfig.GENERAL_INPUT})));
                    newInput.modelName = null;
                    this.inputs.push(newInput);
                }
            },
            initWithValue(value) {
                if (this.lastInitTime && new Date().getTime() - this.lastInitTime < 500) {
                    //TODO this is not the most beautiful way to prevent self-caused model reload
                    return;
                }
                this.lastInitTime = new Date().getTime();
                let originalValue = JSON.parse(JSON.stringify(value)) || [];
                this.lastEmitValue = JSON.parse(JSON.stringify(originalValue));
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
                this.inputs = JSON.parse(JSON.stringify(originalValue));
                let emptyElements = this.inputs.filter(e => !e.modelName);
                if (this.maxInputs && this.inputs.length < this.maxInputs && emptyElements.length <= 1) {
                    this.addInput();
                }
                if (this.minInputs && this.inputs.length < this.minInputs) {
                    this.addInput(this.minInputs - this.inputs.length);
                }
            },
            micVolumeCallback(volume, frequency) {
                this.micValues.volLive = volume;
                this.micValues.volMax = Math.max(volume, this.micValues.volMax);
                for (let input of this.inputs) {
                    if (volume > input.volThresholdHigh) {
                        this.micValues.inputMaxFreqMap[input] = frequency;
                    }
                }
            },
            async toggleMicRecording() {
                this.micRecordError = false;
                try {
                    if (!this.micRecording) {
                        await audioUtil.addMicVolumeCallback(this.micVolumeCallback);
                        this.micRecording = true;
                    } else {
                        await audioUtil.removeMicVolumeCallback(this.micVolumeCallback);
                        this.micRecording = false;
                    }
                } catch (e) {
                    this.micRecordError = true;
                }
            },
            async toggleFacePreview() {
                if (!this.facePreview) {
                    try {
                        await facelandmarkerService.start();
                        this.facePreview = true;
                    } catch (e) {
                        this.facePreview = false;
                    }
                } else {
                    this.facePreview = false;
                    facelandmarkerService.stop();
                }
            },
            getMicVolMaxRange(input) {
                let maxValueConsidered = Math.max(input.volThresholdLow + 5, input.volThresholdHigh + 5);
                return Math.min(maxValueConsidered, 100);
            },
            getMicFreqMaxRange(input) {
                let inputMaxFreq = this.micValues.inputMaxFreqMap[input] || 0;
                let maxValueConsidered = Math.max(inputMaxFreq + 1000, input.freqThresholdLow + 1000, input.freqThresholdHigh + 1000);
                return Math.min(maxValueConsidered, 20000);
            }
        },
        mounted() {
            this.initWithValue(this.value);
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
    .srow.nomargin {
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
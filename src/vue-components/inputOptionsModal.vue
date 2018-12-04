<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="cancel()" @keyup.ctrl.enter="reinit(); $emit('close')">
                    <a class="inline close-button" href="javascript:void(0);" @click="cancel()"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Input Options // Eingabeoptionen
                        </h1>
                    </div>

                    <div class="modal-body" v-if="metadata">
                        <div class="row">
                            <h2 class="two columns">Scanning</h2>
                            <div class="ten columns">
                                <div class="row" >
                                    <div class="twelve columns">
                                        <input v-focus type="checkbox" id="enableScanning" v-model="metadata.inputConfig.scanAutostart" @change="toggleScanning"/>
                                        <label class="inline" for="enableScanning" data-i18n>Enable Scanning // Scanning aktivieren</label>
                                    </div>
                                </div>

                                <div class="row" v-show="metadata.inputConfig.scanAutostart">
                                    <div class="six columns">
                                        <input type="checkbox" id="chkVerticalScanning" v-model="metadata.inputConfig.scanVertical" @change="setVerticalScanning"/>
                                        <label for="chkVerticalScanning" data-i18n>Vertical scanning // Scanning vertikal</label>
                                    </div>
                                    <div class="six columns">
                                        <input type="checkbox" id="chkBinaryScanning" v-model="metadata.inputConfig.scanBinary" @change="setBinaryScanning"/>
                                        <label for="chkBinaryScanning" data-i18n>Binary scanning // Scanning binär</label>
                                    </div>
                                </div>
                                <div class="space"/>
                                <div class="row" v-show="metadata.inputConfig.scanAutostart">
                                    <div class="six columns slidergroup">
                                        <label for="inScanTime" data-i18n>Scanning Time (ms) // Scanning Zeit (ms)</label>
                                        <input type="range" id="inScanTime" v-model.number="metadata.inputConfig.scanTimeoutMs" @change="changeScanningMs" min="100" max="3000" step="100"/>
                                        <input type="number" v-model.number="metadata.inputConfig.scanTimeoutMs" @change="changeScanningMs" min="100" max="3000" step="100"/>
                                    </div>
                                    <div class="six columns slidergroup">
                                        <label for="inFirstElement" data-i18n>Time factor first element // Zeit-Faktor erstes Element</label>
                                        <input type="range" id="inFirstElement" v-model.number="metadata.inputConfig.scanTimeoutFirstElementFactor" @change="changeFirstElementFactor" min="1" max="5" step="0.1"/>
                                        <input type="number" v-model.number="metadata.inputConfig.scanTimeoutFirstElementFactor" @change="changeFirstElementFactor" min="1" max="5" step="0.5" />
                                    </div>
                                </div>
                                <div class="space-2x"/>
                                <div class="row" v-show="metadata.inputConfig.scanAutostart">
                                    <div class="four columns">
                                        <label data-i18n="">Scanning keyboard key // Scanning Auswahl-Taste</label>
                                    </div>
                                    <div class="three columns">
                                        <span v-show="metadata.inputConfig.scanKey">Keycode:&nbsp;{{metadata.inputConfig.scanKey}}</span>
                                        <span v-show="metadata.inputConfig.scanKeyName">Name:&nbsp;{{metadata.inputConfig.scanKeyName}}</span>
                                        <span v-show="!metadata.inputConfig.scanKey" data-i18n="">(none) // (keine)</span>
                                    </div>
                                    <button class="five columns" @click="recordKey">
                                        <span v-show="!isRecordingKey" data-i18n="">Record other key // Andere Taste aufnehmen</span>
                                        <span v-show="isRecordingKey" data-i18n="">Recording... press key! // Aufnahme... Taste drücken!</span>
                                    </button>
                                </div>
                                <div class="space-2x"/>
                                <div class="row" v-show="metadata.inputConfig.scanAutostart">
                                    <div class="four columns">
                                        <label data-i18n="">Scanning ARE events // Scanning Auswahl ARE-Events</label>
                                    </div>
                                    <div class="eight columns">
                                        <label for="inputAREURI" class="normal-text">ARE URL</label>
                                        <input id="inputAREURI" class="spaced" type="text" style="width: 60%" v-model="metadata.inputConfig.areURL"/>
                                    </div>
                                </div>
                                <div class="row" v-show="metadata.inputConfig.scanAutostart">
                                    <div class="seven columns">
                                        <ul>
                                            <li v-for="areEvent in metadata.inputConfig.areEvents">
                                                <button @click="removeAreEvent(areEvent)" class="spaced" style="padding: 0px 5px">X</button>
                                                {{formatAreEvent(areEvent)}}
                                            </li>
                                            <li v-show="metadata.inputConfig.areEvents.length == 0" data-i18n="">
                                                (no recorded events) // (keine aufgenommenen Events)
                                            </li>
                                            <li v-show="areConnectionError" style="color: red">
                                                <i class="fas fa-times" />  <span data-i18n="">Connecting to ARE failed! // Verbindung zu ARE fehlgeschlagen!</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <button class="five columns" @click="recordAreEvent">
                                        <span v-show="!isRecordingARE && areConnectionError != null" data-i18n="">Record ARE events // ARE events aufnehmen</span>
                                        <span v-show="!isRecordingARE && areConnectionError == null">Check ARE...</span>
                                        <span v-show="isRecordingARE" data-i18n="">Recording... trigger ARE events! // Aufnahme... ARE-Events auslösen!</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="space-2x"/>
                        <div class="row">
                            <h2 class="two columns">Hovering</h2>

                            <div class="ten columns">
                                <div class="row" >
                                    <div class="five columns">
                                        <input type="checkbox" id="chkHover" v-model="metadata.inputConfig.hoverEnabled" @change="setHover"/>
                                        <label for="chkHover"data-i18n>Enable Hovering // Hovering aktivieren</label>
                                        <div class="space"/>
                                    </div>
                                    <div class="seven columns slidergroup">
                                        <label for="inHoverTime" data-i18n>Hover Time (ms) // Hover Zeit (ms)</label>
                                        <input type="range" id="inHoverTime" v-model.number="metadata.inputConfig.hoverTimeoutMs" @change="changeHoverMs" min="100" max="3000" step="100"/>
                                        <input type="number" v-model.number="metadata.inputConfig.hoverTimeoutMs" @change="changeHoverMs" min="100" max="3000" step="100" style="width: 5.5em"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="space-2x"/>
                        <div class="row">
                            <h2 class="two columns" data-i18n>Others // Anderes</h2>
                            <div class="ten columns">
                                <div class="row" >
                                    <input type="checkbox" id="chkMouse" v-model="metadata.inputConfig.mouseclickEnabled" @change="setClickControl"/>
                                    <label for="chkMouse" data-i18n>Select with mouse click // Auswahl mit Mausklick</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container">
                            <button @click="cancel()">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button @click="reinit(); $emit('close')">
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
    import {dataService} from './../js/service/dataService'
    import {areService} from './../js/service/areService'
    import {Router} from './../js/router'
    import {I18nModule} from './../js/i18nModule.js';
    import './../css/modal.css';

    export default {
        props: ['metadataProperty', 'scanner', 'hover', 'clicker', 'reinit'],
        data: function () {
            return {
                originalMetadata: null,
                metadata: null,
                isRecordingKey: false,
                isRecordingARE: false,
                lastRecordTime: 0,
                areConnectionError: false
            }
        },
        methods: {
            cancel () {
                var thiz = this;
                if(JSON.stringify(thiz.originalMetadata) != JSON.stringify(thiz.metadata)) {
                    dataService.saveMetadata(thiz.originalMetadata).then(() => {
                        this.reinit();
                        this.$emit('close');
                    });
                } else {
                    this.$emit('close');
                }
            },
            setHover: function (event) {
                if (event.target.checked) {
                    this.hover.startHovering();
                } else {
                    this.hover.stopHovering();
                }
                dataService.saveMetadata(this.metadata);
            },
            changeHoverMs: function (event) {
                this.metadata.inputConfig.hoverTimeoutMs = Number.parseInt(event.target.value);
                this.hover.setHoverTimeout(this.metadata.inputConfig.hoverTimeoutMs);
                dataService.saveMetadata(this.metadata);
            },
            setClickControl: function (event) {
                if (event.target.checked) {
                    this.clicker.startClickcontrol();
                } else {
                    this.clicker.stopClickcontrol();
                }
                dataService.saveMetadata(this.metadata);
            },
            toggleScanning: function (event) {
                if (event.target.checked) {
                    this.scanner.startScanning();
                } else {
                    this.scanner.stopScanning();
                }
                dataService.saveMetadata(this.metadata);
            },
            setVerticalScanning: function (event) {
                this.updateScanningOptions({
                    scanVertical: event.target.checked
                }, true);
            },
            setBinaryScanning: function (event) {
                this.updateScanningOptions({
                    scanBinary: event.target.checked
                }, true);
            },
            changeScanningMs: function (event) {
                this.updateScanningOptions({
                    scanTimeoutMs: Number.parseInt(event.target.value)
                });
            },
            changeFirstElementFactor: function (event) {
                this.updateScanningOptions({
                    scanTimeoutFirstElementFactor: Number.parseFloat(event.target.value)
                });
            },
            updateScanningOptions: function (optionsToUpdate, restart) {
                var thiz = this;
                thiz.scanner.updateOptions(optionsToUpdate, restart);
                dataService.saveMetadata(thiz.metadata);
            },
            recordKey() {
                var thiz = this;
                if(this.isRecordingKey) {
                    stopRecording(thiz);
                    return;
                }
                if(new Date().getTime() - this.lastRecordTime < 300) {
                    return;
                }

                thiz.isRecordingKey = true;
                document.addEventListener("keydown", listener);
                function listener(event) {
                    event.preventDefault();
                    thiz.metadata.inputConfig.scanKey = event.keyCode;
                    thiz.metadata.inputConfig.scanKeyName = event.code;
                    thiz.updateScanningOptions({selectKeyCode: event.keyCode});
                    stopRecording(thiz);
                }
                function stopRecording(thiz) {
                    thiz.lastRecordTime = new Date().getTime();
                    thiz.isRecordingKey = false;
                    document.removeEventListener("keydown", listener);
                }
            },
            recordAreEvent() {
                var thiz = this;
                thiz.areConnectionError = null;
                if(this.isRecordingARE) {
                    stopRecording(thiz);
                    return;
                }

                areService.getModelName(thiz.metadata.inputConfig.areURL).then(() => {
                    thiz.areConnectionError = false;
                    thiz.isRecordingARE = true;
                    areService.subscribeEvents(function (event) {
                        if(!thiz.metadata.inputConfig.areEvents.includes(event)) {
                            thiz.metadata.inputConfig.areEvents.push(event);
                        }
                        setTimeout(function () {
                            stopRecording(thiz);
                        }, 500);
                    }, thiz.metadata.inputConfig.areURL);
                }, () => {
                    thiz.areConnectionError = true;
                });

                function stopRecording(thiz) {
                    areService.unsubscribeEvents();
                    thiz.isRecordingARE = false;
                    thiz.areConnectionError = false;
                    dataService.saveMetadata(thiz.metadata);
                }
            },
            formatAreEvent(eventString) {
                let eventObject = JSON.parse(eventString);
                return eventObject.targetComponentId + " -> " + eventObject.channelId;
            },
            removeAreEvent(areEvent) {
                this.metadata.inputConfig.areEvents = this.metadata.inputConfig.areEvents.filter(e => e !== areEvent);
                dataService.saveMetadata(this.metadata);
            }
        },
        mounted () {
            var thiz = this;
            log.debug('opened modal: ' + thiz.gridId);
            thiz.originalMetadata = JSON.parse(JSON.stringify(thiz.metadataProperty));
            thiz.metadata = JSON.parse(JSON.stringify(thiz.metadataProperty));
            thiz.metadata.inputConfig.areURL = areService.getRestURL();
            I18nModule.init();
        },
        updated () {
            I18nModule.init();
        }
    }
</script>

<style scoped>
    h2 {
        font-size: 1.3em;
        margin: 0;
        padding: 0;
    }

    .row {
        margin-top: 0.5em;
    }

    ul {
        list-style-type: none;
    }

    .space {
        margin-top: 1.25em;
    }

    .space-2x {
        margin-top: 2.0em;
    }

    .slidergroup{
    }

    .slidergroup label{
        display: block;
    }

    .slidergroup input[type="range"] {
        width: 40%;
    }

    .slidergroup input[type="number"] {
        width: 5em;
        margin-left: 0.5em;
    }

    .normal-text {
        font-weight: normal;
    }
</style>
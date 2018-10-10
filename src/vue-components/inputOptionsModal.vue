<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container">
                    <a class="inline close-button" href="javascript:void(0);" @click="cancel()"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Input Options // Eingabeoptionen
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="row">
                            <h2 class="two columns">Scanning</h2>
                            <div class="ten columns">
                                    <div class="row" >
                                        <div class="twelve columns">
                                            <input type="checkbox" id="enableScanning" v-model="gridData.inputConfig.scanAutostart" @change="toggleScanning"/>
                                            <label class="inline" for="enableScanning" data-i18n>Enable Scanning // Scanning aktivieren</label>
                                        </div>
                                    </div>

                                    <div class="row" v-show="gridData.inputConfig.scanAutostart">
                                        <div class="six columns">
                                            <input type="checkbox" id="chkVerticalScanning" v-model="gridData.inputConfig.scanVertical" @change="setVerticalScanning"/>
                                            <label for="chkVerticalScanning" data-i18n>Vertical scanning // Scanning vertikal</label>
                                        </div>
                                        <div class="six columns">
                                            <input type="checkbox" id="chkBinaryScanning" v-model="gridData.inputConfig.scanBinary" @change="setBinaryScanning"/>
                                            <label for="chkBinaryScanning" data-i18n>Binary scanning // Scanning binär</label>
                                        </div>
                                    </div>
                                    <div class="space"/>
                                    <div class="row" v-show="gridData.inputConfig.scanAutostart">
                                        <div class="six columns slidergroup">
                                            <label for="inScanTime" data-i18n>Scanning Time (ms) // Scanning Zeit (ms)</label>
                                            <input type="range" id="inScanTime" v-model="gridData.inputConfig.scanTimeoutMs" @change="changeScanningMs" min="100" max="3000" step="100"/>
                                            <input type="number" v-model="gridData.inputConfig.scanTimeoutMs" @change="changeScanningMs" min="100" max="3000" step="100"/>
                                        </div>
                                        <div class="six columns slidergroup">
                                            <label for="inFirstElement" data-i18n>Time factor first element // Zeit-Faktor erstes Element</label>
                                            <input type="range" id="inFirstElement" v-model="gridData.inputConfig.scanTimeoutFirstElementFactor" @change="changeFirstElementFactor" min="1" max="5" step="0.1"/>
                                            <input type="number" v-model="gridData.inputConfig.scanTimeoutFirstElementFactor" @change="changeFirstElementFactor" min="1" max="5" step="0.5" />
                                        </div>
                                    </div>
                            </div>
                        </div>
                        <div class="space-2x"/>
                        <div class="row">
                            <h2 class="two columns">Hovering</h2>

                            <div class="ten columns">
                                <div class="row" >
                                    <div class="five columns">
                                        <input type="checkbox" id="chkHover" v-model="gridData.inputConfig.hoverEnabled" @change="setHover"/>
                                        <label for="chkHover"data-i18n>Enable Hovering // Hovering aktivieren</label>
                                        <div class="space"/>
                                    </div>
                                    <div class="seven columns slidergroup">
                                        <label for="inHoverTime" data-i18n>Hover Time (ms) // Hover Zeit (ms)</label>
                                        <input type="range" id="inHoverTime" v-model="gridData.inputConfig.hoverTimeoutMs" @change="changeHoverMs" min="100" max="3000" step="100"/>
                                        <input type="number" v-model="gridData.inputConfig.hoverTimeoutMs" @change="changeHoverMs" min="100" max="3000" step="100" style="width: 5.5em"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="space-2x"/>
                        <div class="row">
                            <h2 class="two columns" data-i18n>Others // Anderes</h2>
                            <div class="ten columns">
                                <div class="row" >
                                    <input type="checkbox" id="chkMouse" v-model="gridData.inputConfig.mouseclickEnabled" @change="setClickControl"/>
                                    <label for="chkMouse" data-i18n>Select with mouse click // Auswahl mit Mausklick</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="u-pull-right" @click="$emit('close')">
                            OK
                        </button>
                        <button class="u-pull-right spaced" @click="cancel()" data-i18n>
                            Cancel // Abbrechen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from './../js/service/dataService'
    import {Router} from './../js/router'
    import {I18nModule} from './../js/i18nModule.js';
    import './../css/modal.css';

    export default {
        props: ['gridData', 'scanner', 'hover', 'clicker', 'reinit'],
        data: function () {
            return {
                gridElement: null,
                metadata: null,
                originalGridData: null,
            }
        },
        methods: {
            cancel () {
                var thiz = this;
                if(JSON.stringify(thiz.originalGridData) != JSON.stringify(thiz.gridData)) {
                    dataService.saveGrid(thiz.originalGridData).then(() => {
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
                dataService.updateInputConfig(this.gridData.id, {
                    hoverEnabled: event.target.checked
                });
            },
            changeHoverMs: function (event) {
                var newOptions = {
                    hoverTimeoutMs: Number.parseInt(event.target.value)
                };
                this.hover.setHoverTimeout(newOptions.hoverTimeoutMs);
                dataService.updateInputConfig(this.gridData.id, newOptions);
            },
            setClickControl: function (event) {
                if (event.target.checked) {
                    this.clicker.startClickcontrol();
                } else {
                    this.clicker.stopClickcontrol();
                }
                dataService.updateInputConfig(this.gridData.id, {
                    mouseclickEnabled: event.target.checked
                });
            },
            toggleScanning: function (event) {
                if (event.target.checked) {
                    this.scanner.startScanning();
                } else {
                    this.scanner.stopScanning();
                }
                dataService.updateInputConfig(this.gridData.id, {
                    scanAutostart: event.target.checked
                });
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
                this.scanner.updateOptions(optionsToUpdate, restart);
                dataService.updateInputConfig(this.gridData.id, optionsToUpdate);
            }
        },
        mounted () {
            var thiz = this;
            console.log('opened modal: ' + thiz.gridId);
            thiz.originalGridData = JSON.parse(JSON.stringify(thiz.gridData));
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
</style>
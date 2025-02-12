<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-sm-2" for="mode">{{ $t('displayMode') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="mode" v-model="gridElement.mode">
                    <option :value="undefined">{{ $t('pleaseSelect') }}</option>
                    <option v-for="mode in GridElementDisplay.MODES" :value="mode">{{ mode | translate }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-if="gridElement.mode === GridElementDisplay.MODE_DATETIME">
            <label class="col-sm-2" for="dt_format">{{ $t('dateTimeFormat') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="dt_format" v-model="gridElement.dateTimeFormat">
                    <option :value="undefined">{{ $t('pleaseSelect') }}</option>
                    <option v-for="format in GridElementDisplay.DT_FORMATS" :value="format">
                        {{ format | translate }} - [{{displayElementService.getCurrentValue({ mode: GridElementDisplay.MODE_DATETIME, dateTimeFormat: format})}}]
                    </option>
                </select>
            </div>
        </div>
        <div class="row" v-if="gridElement.mode === GridElementDisplay.MODE_APP_STATE">
            <label class="col-sm-2" for="appState">{{ $t('MODE_APP_STATE') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="appState" v-model="gridElement.appState">
                    <option :value="undefined">{{ $t('pleaseSelect') }}</option>
                    <option v-for="state in GridElementDisplay.APP_STATES" :value="state">{{ state | translate }}</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement.js";
    import { GridElementDisplay } from '../../js/model/GridElementDisplay';
    import { displayElementService } from '../../js/service/displayElementService';

    export default {
        props: ['gridElement'],
        data: function () {
            return {
                GridElementDisplay: GridElementDisplay,
                displayElementService: displayElementService
            }
        },
        methods: {
        },
        mounted() {
            this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] = this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] || false;
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.row {
    margin-bottom: 1em;
}
</style>
<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-sm-4" for="mode">{{ $t('displayMode') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="mode" v-model="gridElement.mode">
                    <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                    <option v-for="mode in GridElementDisplay.MODES" :value="mode">{{ mode | translate }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-if="gridElement.mode === GridElementDisplay.MODE_DATETIME">
            <label class="col-sm-4" for="dt_format">{{ $t('dateTimeFormat') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="dt_format" v-model="gridElement.dateTimeFormat">
                    <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                    <option v-for="format in GridElementDisplay.DT_FORMATS" :value="format">
                        {{ format | translate }} - [{{displayElementService.getCurrentValue({ mode: GridElementDisplay.MODE_DATETIME, dateTimeFormat: format})}}]
                    </option>
                </select>
            </div>
        </div>
        <div class="row" v-if="gridElement.mode === GridElementDisplay.MODE_APP_STATE">
            <label class="col-sm-4" for="appState">{{ $t('MODE_APP_STATE') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="appState" v-model="gridElement.appState">
                    <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                    <option v-for="state in GridElementDisplay.APP_STATES" :value="state">{{ state | translate }}</option>
                </select>
            </div>
        </div>
        <div v-if="gridElement.mode === GridElementDisplay.MODE_ACTION_RESULT">
            <div class="row">
                <label class="col-sm-4" for="actionType">{{ $t('actionType') }}</label>
                <div class="col-sm-7">
                    <select class="col-12" id="actionType" v-model="actionType" @change="actionTypeChanged">
                        <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                        <option v-for="type in possibleActionTypes" :value="type">{{ type | translate }}</option>
                    </select>
                </div>
            </div>
            <div v-if="gridElement.displayAction">
                <h2>$t('edit') {{gridElement.displayAction.modelName | translate}}</h2>
                <edit-action :action="gridElement.displayAction"/>
            </div>
            <div v-if="gridElement.displayAction">
                <h2>Extract information</h2>
                <div class="row">
                    <label class="col-sm-4" for="extractMode">{{ $t('extractMode') }}</label>
                    <div class="col-sm-7">
                        <select class="col-12" id="extractMode" v-model="gridElement.extractMode">
                            <option v-for="mode in GridElementDisplay.EXTRACT_MODES" :value="mode">{{ mode | translate }}</option>
                        </select>
                    </div>
                </div>
                <div class="row" v-if="gridElement.extractMode === GridElementDisplay.EXTRACT_JSON">
                    <label class="col-sm-4" for="extractMode">{{ $t('jsonPath') }}</label>
                    <div class="col-sm-7">
                        <input type="text" class="col-12" v-model="gridElement.extractInfo" :placeholder="$t('egJsonPath')">
                    </div>
                </div>
                <div class="row" v-if="gridElement.extractMode === GridElementDisplay.EXTRACT_HTML_SELECTOR">
                    <label class="col-sm-4" for="extractMode">{{ $t('htmlSelector') }}</label>
                    <div class="col-sm-7">
                        <input type="text" class="col-12" v-model="gridElement.extractInfo" :placeholder="$t('egHtmlSelector')">
                    </div>
                </div>
                <div class="row" v-if="gridElement.extractMode === GridElementDisplay.EXTRACT_HTML_SELECTOR">
                    <label class="col-sm-4" for="elementIndex">{{ $t('elementIndex') }}</label>
                    <div class="col-sm-7">
                        <input id="elementIndex" type="number" class="col-12" v-model.number="gridElement.extractInfo2">
                    </div>
                </div>
                <div class="row" v-if="gridElement.extractMode === GridElementDisplay.EXTRACT_SUBSTRING">
                    <label class="col-sm-4" for="startIndex">{{ $t('startIndex') }}</label>
                    <div class="col-sm-7">
                        <input id="startIndex" type="number" class="col-12" v-model.number="gridElement.extractInfo">
                    </div>
                </div>
                <div class="row" v-if="gridElement.extractMode === GridElementDisplay.EXTRACT_SUBSTRING">
                    <label class="col-sm-4" for="endIndex">{{ $t('endIndex') }}</label>
                    <div class="col-sm-7">
                        <input id="endIndex" type="number" class="col-12" v-model.number="gridElement.extractInfo2">
                    </div>
                </div>
                <div class="row">
                    <button @click="test">{{$t('test')}}</button>
                    <span>{{result}}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement.js";
    import { GridElementDisplay } from '../../js/model/GridElementDisplay';
    import { displayElementService } from '../../js/service/displayElementService';
    import { GridActionHTTP } from '../../js/model/GridActionHTTP';
    import { GridActionPredefined } from '../../js/model/GridActionPredefined';
    import EditAction from './editAction.vue';

    export default {
        components: { EditAction },
        props: ['gridElement'],
        data: function () {
            return {
                GridElementDisplay: GridElementDisplay,
                displayElementService: displayElementService,
                possibleActionTypes: [GridActionHTTP.getModelName(), GridActionPredefined.getModelName()],
                actionType: undefined,
                result: ''
            }
        },
        methods: {
            actionTypeChanged() {
                this.gridElement.displayAction = GridElement.getActionInstance(this.actionType);
                this.gridElement.displayAction.isDisplayAction = true;
            },
            async test() {
                this.result = await displayElementService.getCurrentValue(this.gridElement, {forceUpdate: true});
            }
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

h2 {
    font-size: 1.2em;
    margin-top: 1.5em;
    margin-bottom: 0.7em;
}
</style>
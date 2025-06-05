<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-sm-4" for="mode">{{ $t('displayMode') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="mode" v-model="gridElement.mode">
                    <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                    <option v-for="mode in GridElementLive.MODES" :value="mode">{{ mode | translate }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-if="gridElement.mode === GridElementLive.MODE_DATETIME">
            <label class="col-sm-4" for="dt_format">{{ $t('dateTimeFormat') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="dt_format" v-model="gridElement.dateTimeFormat">
                    <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                    <option v-for="format in GridElementLive.DT_FORMATS" :value="format">
                        <span>{{ format | translate }} - </span>
                        <span>[{{ currentDtValues[format] }}]</span>
                    </option>
                </select>
            </div>
        </div>
        <div class="row" v-if="gridElement.mode === GridElementLive.MODE_APP_STATE">
            <label class="col-sm-4" for="appState">{{ $t('MODE_APP_STATE') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="appState" v-model="gridElement.appState">
                    <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                    <option v-for="state in GridElementLive.APP_STATES" :value="state">{{ state | translate }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-if="gridElement.mode === GridElementLive.MODE_RANDOM">
            <label class="col-sm-4" for="valuesToChooseFrom">{{ $t('valuesToChooseFrom') }}</label>
            <div class="col-sm-7">
                <input id="valuesToChooseFrom" type="text" class="col-12" v-model="gridElement.chooseValues" :placeholder="$t('egChooseValues')">
            </div>
        </div>
        <div class="row" v-if="gridElement.mode === GridElementLive.MODE_PODCAST_STATE">
            <label class="col-sm-4" for="appState">{{ $t('MODE_PODCAST_STATE') }}</label>
            <div class="col-sm-7">
                <select class="col-12" id="appState" v-model="gridElement.state">
                    <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                    <option v-for="state in GridElementLive.PODCAST_STATES" :value="state">{{ state | translate }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-if="[GridElementLive.MODE_ACTION_RESULT, GridElementLive.MODE_RANDOM].includes(gridElement.mode)">
            <label class="col-sm-4" for="updateInterval">{{ $t('updateIntervalSeconds') }}</label>
            <div class="col-sm-7">
                <input id="updateInterval" type="number" class="col-12" v-model.number="gridElement.updateSeconds" :placeholder="$t('updateIntervalPlaceholder')">
            </div>
        </div>
        <div v-if="gridElement.mode === GridElementLive.MODE_ACTION_RESULT">
            <div class="row">
                <label class="col-sm-4" for="actionType">{{ $t('actionType') }}</label>
                <div class="col-sm-7">
                    <select class="col-12" id="actionType" v-model="actionType" @change="actionTypeChanged">
                        <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                        <option v-for="type in possibleActionTypes" :value="type">{{ type | translate }}</option>
                    </select>
                </div>
            </div>
            <div v-if="gridElement.liveAction">
                <h2>{{$t('edit')}} {{gridElement.liveAction.modelName | translate}}</h2>
                <edit-action :action="gridElement.liveAction" @change="liveActionChanged"/>
            </div>
            <div v-if="gridElement.liveAction">
                <h2>{{$t('extractData')}}</h2>
                <div v-if="gridElement.liveAction.modelName === GridActionHTTP.getModelName()">
                    <div class="row">
                        <label class="col-sm-4" for="extractMode">{{ $t('extractMode') }}</label>
                        <div class="col-sm-7">
                            <select class="col-12" id="extractMode" v-model="gridElement.extractMode">
                                <option v-for="mode in GridElementLive.EXTRACT_MODES" :value="mode">{{ mode | translate }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="row" v-if="gridElement.extractMode === GridElementLive.EXTRACT_JSON">
                        <label class="col-sm-4" for="extractMode">{{ $t('jsonPath') }}</label>
                        <div class="col-sm-7">
                            <input type="text" class="col-12" v-model="gridElement.extractSelector" :placeholder="$t('egJsonPath')">
                        </div>
                    </div>
                    <div class="row" v-if="gridElement.extractMode === GridElementLive.EXTRACT_HTML_SELECTOR">
                        <label class="col-sm-4" for="extractMode">{{ $t('cssSelector') }}</label>
                        <div class="col-sm-7">
                            <input type="text" class="col-12" v-model="gridElement.extractSelector" :placeholder="$t('egCssSelector')">
                        </div>
                    </div>
                    <div class="row" v-if="gridElement.extractMode === GridElementLive.EXTRACT_HTML_SELECTOR">
                        <label class="col-sm-4" for="elementIndex">{{ $t('elementIndex') }}</label>
                        <div class="col-sm-7">
                            <input id="elementIndex" type="number" class="col-12" v-model.number="gridElement.extractIndex" :placeholder="$t('egElementIndex')">
                        </div>
                    </div>
                </div>
                <div v-if="gridElement.liveAction.modelName === GridActionPredefined.getModelName()">
                    <div class="row">
                        <label class="col-sm-4" for="extractInfo">{{ $t('valueToDisplay') }}</label>
                        <div class="col-sm-7">
                            <select class="col-12" id="extractInfo" v-model="extractInfo" @change="extractInfoChanged">
                                <option :value="undefined" disabled selected hidden="">{{ $t('pleaseSelect') }}</option>
                                <option v-for="info in extractInfos" :value="info">{{i18nService.tPredefined(info.name)}}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="row" style="margin-top: 3em">
                    <button class="col-sm-4" @click="test"><i class="fas fa-bolt"></i> {{$t('test')}}</button>
                </div>
                <div class="row">
                    {{result}}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement.js";
    import { GridElementLive } from '../../js/model/GridElementLive';
    import { liveElementService } from '../../js/service/liveElementService';
    import { GridActionHTTP } from '../../js/model/GridActionHTTP';
    import { GridActionPredefined } from '../../js/model/GridActionPredefined';
    import EditAction from './editAction.vue';
    import { i18nService } from '../../js/service/i18nService';

    export default {
        components: { EditAction },
        props: ['gridElement'],
        data: function () {
            return {
                GridElementLive: GridElementLive,
                liveElementService: liveElementService,
                possibleActionTypes: [GridActionPredefined.getModelName(), GridActionHTTP.getModelName()],
                actionType: undefined,
                result: '',
                extractInfo: undefined,
                GridActionHTTP: GridActionHTTP,
                GridActionPredefined: GridActionPredefined,
                updateCounter: 0,
                i18nService: i18nService,
                currentDtValues: {}
            }
        },
        computed: {
            extractInfos() {
                this.updateCounter--;
                let action = this.gridElement.liveAction;
                if(!action || !action.actionInfo || !action.actionInfo.extract) {
                    return [];
                }
                return action.actionInfo.extract.extractInfos || [];
            },
            extractMode() {
                let action = this.gridElement.liveAction;
                if(!action || !action.actionInfo || !action.actionInfo.extract) {
                    return undefined;
                }
                return action.actionInfo.extract.mode || undefined;
            },
            extractInfoBasedOnCurrent() {
                if (!this.gridElement || !this.gridElement.liveAction || !this.gridElement.liveAction.actionInfo ||
                    !this.gridElement.liveAction.actionInfo.extract ||
                    !this.gridElement.liveAction.modelName === GridActionPredefined.getModelName()) {
                    return undefined;
                }
                let infos = this.gridElement.liveAction.actionInfo.extract.extractInfos;
                return infos.find(i => i.selector === this.gridElement.extractSelector) || undefined;
            }
        },
        methods: {
            actionTypeChanged() {
                this.gridElement.liveAction = GridElement.getActionInstance(this.actionType);
                this.gridElement.liveAction.isLiveAction = true;
            },
            async test() {
                this.result = await liveElementService.getCurrentValue(this.gridElement, {forceUpdate: true});
            },
            extractInfoChanged() {
                this.gridElement.extractMode = this.extractMode;
                this.gridElement.extractSelector = this.extractInfo.selector;
                this.gridElement.extractMappings = this.extractInfo.mappings;
            },
            liveActionChanged() {
                this.updateCounter++;
                this.extractInfo = undefined;
                this.$nextTick(() => {
                    if (this.extractInfos.length === 1) {
                        this.extractInfo = this.extractInfos[0];
                        this.extractInfoChanged();
                    }
                });
            }
        },
        async mounted() {
            this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] = this.gridElement.additionalProps[GridElement.PROP_YT_PREVENT_CLICK] || false;
            this.actionType = this.gridElement.liveAction ? this.gridElement.liveAction.modelName : undefined;
            this.extractInfo = this.extractInfoBasedOnCurrent;
            for (let format of GridElementLive.DT_FORMATS) {
                this.$set(this.currentDtValues, format, await liveElementService.getCurrentValue( {
                    mode: GridElementLive.MODE_DATETIME,
                    dateTimeFormat: format
                }));
            }
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
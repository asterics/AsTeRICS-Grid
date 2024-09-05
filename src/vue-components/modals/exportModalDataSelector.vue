<template>
<div>
    <div class="row">
        <div class="col-md-6">
            <div class="row">
                <label class="col-12" for="selectGrid">{{ $t('selectGrid') }}</label>
                <div class="col-12">
                    <select class="col-12" id="selectGrid" v-model="selectedGrid" @change="calcBackupInfo">
                        <option :value="null">{{ $t('allGrids') }} (<span>{{grids.length}} <span>{{ $t('grids') }}</span></span>)</option>
                        <option v-for="elem in graphList" :value="elem.grid">{{elem.grid.label | extractTranslation}}</option>
                    </select>
                </div>
            </div>
            <div class="row" v-if="selectedGrid">
                <div v-show="allChildren.length > 0">
                    <input id="exportConnected" type="checkbox" v-model="options.exportConnected" @change="calcBackupInfo"/>
                    <label for="exportConnected">
                        <span>{{ $t('exportAllChildGrids') }}</span>
                        <span>({{allChildren.length}} <span>{{ $t('grids') }}</span>)</span>
                    </label>
                </div>
            </div>
        </div>
        <div class="col-md-6" v-if="selectedGrid">
            <div class="row">
                <div class="col-12">
                    <img v-if="selectedGrid && selectedGrid.thumbnail" :src="selectedGrid.thumbnail.data" style="max-height: 250px; max-width: 100%; display: block; margin: auto">
                </div>
            </div>
        </div>
    </div>

    <accordion :acc-label="$t('ADVANCED_SETTINGS')" acc-label-type="h2" acc-background-color="white" v-if="!this.hideAdvancedSettings">
        <div class="row">
            <label class="col-12 col-md-2" for="selectExportLang">{{ $t('exportLanguages') }}</label>
            <div class="col-12 col-md-4 mb-4">
                <select class="col-12" id="selectExportLang" v-model="options.exportLang" @change="calcBackupInfo">
                    <option v-for="option in options.exportLangOptions" :value="option">{{option | translate}}</option>
                </select>
            </div>
            <div class="col-12 col-md-4">
                <span v-if="options.exportLang === constants.LANG_EXPORT_CURRENT">{{ $t('currentLanguage', {contentLangReadable: i18nService.getContentLangReadable(), contentLangCode: i18nService.getContentLang()}) }}</span>
                <span v-if="options.exportLang === constants.LANG_EXPORT_ALL">
                <span>{{ $t('currentLanguages', {length: currentLanguages.length}) }} </span>
                <span v-for="(lang, index) in currentLanguages" :title="i18nService.getLangReadable(lang)">{{lang + (index < currentLanguages.length -1 ? ', ' : '')}}</span>
            </span>
            </div>
        </div>
        <div class="row">
            <div>
                <input id="exportDictionaries" type="checkbox" v-model="options.exportDictionaries" @change="calcBackupInfo"/>
                <label for="exportDictionaries">{{ $t('exportDictionaries') }}</label>
            </div>
        </div>
        <div class="row">
            <div>
                <input id="exportUserSettings" type="checkbox" v-model="options.exportUserSettings" @change="calcBackupInfo"/>
                <label for="exportUserSettings">{{ $t('exportUserSettingsAndInputConfig') }}</label>
            </div>
        </div>
        <div class="row">
            <div>
                <input id="exportGlobalGrid" type="checkbox" v-model="options.exportGlobalGrid" @change="calcBackupInfo"/>
                <label for="exportGlobalGrid">{{ $t('exportGlobalGrid') }}</label>
            </div>
        </div>
        <div class="row">
            <div>
                <input id="exportOBZ" type="checkbox" v-model="options.exportOBZ" @change="calcBackupInfo"/>
                <label for="exportOBZ">{{ $t('exportOBZ') }}</label>
            </div>
        </div>
    </accordion>
</div>
</template>

<script>
import {dataService} from '../../js/service/data/dataService'
import './../../css/modal.css';
import {gridUtil} from "../../js/util/gridUtil.js";
import {i18nService} from "../../js/service/i18nService.js";
import Accordion from '../components/accordion.vue';
import { localStorageService } from '../../js/service/data/localStorageService';
import { util } from '../../js/util/util';

let constants = {
    LANG_EXPORT_CURRENT: 'LANG_EXPORT_CURRENT',
    LANG_EXPORT_ALL: 'LANG_EXPORT_ALL'
}

export default {
    components: { Accordion },
    props: ['value', 'exportOptions', 'hideAdvancedSettings'],
    data: function () {
        return {
            grids: [],
            selectedGrid: null,
            graphList: [],
            allChildren: [],
            options: {
                exportConnected: false,
                exportDictionaries: false,
                exportUserSettings: true,
                exportGlobalGrid: true,
                exportOBZ: false,
                exportLang: constants.LANG_EXPORT_ALL,
                exportLangOptions: [constants.LANG_EXPORT_ALL, constants.LANG_EXPORT_CURRENT]
            },
            constants: constants,
            i18nService: i18nService
        }
    },
    computed: {
        currentLanguages: function () {
            let grids = this.selectedGrid ? [this.selectedGrid] : this.grids;
            return gridUtil.getLanguages(grids);
        }
    },
    methods: {
        async calcBackupInfo() {
            let gridIds = [];
            if (this.selectedGrid) {
                gridIds = [this.selectedGrid.id];
                this.allChildren = gridUtil.getAllChildrenRecursive(this.graphList, this.selectedGrid.id);
                if (this.options.exportConnected) {
                    gridIds = gridIds.concat(this.allChildren.map(grid => grid.id));
                }
            } else { // "All grids"
                gridIds = this.grids.map(grid => grid.id);
                this.allChildren = [];
            }
            let user = localStorageService.getAutologinUser();
            let filename = null;
            if (gridIds.length === 1 && this.selectedGrid) {
                filename = `${user}_${util.getCurrentDateTimeString()}_${i18nService.getTranslation(this.selectedGrid.label)}`;
            } else {
                filename = `${user}_${util.getCurrentDateTimeString()}_asterics-grid-custom-backup`;
            }
            let backupInfo = {
                gridIds: gridIds,
                options: {
                    exportGlobalGrid: this.options.exportGlobalGrid,
                    exportOnlyCurrentLang: this.options.exportLang === constants.LANG_EXPORT_CURRENT,
                    exportDictionaries: this.options.exportDictionaries,
                    exportUserSettings: this.options.exportUserSettings,
                    obzFormat: this.options.exportOBZ,
                    filename: filename
                }
            }
            this.$emit('input', backupInfo);
            this.$emit('change', backupInfo);
            this.$forceUpdate();
        }
    },
    async mounted() {
        this.grids = await dataService.getGrids(false, true);
        this.graphList = gridUtil.getGraphList(this.grids);
        let startId = this.exportOptions ? this.exportOptions.gridId : null;
        this.selectedGrid = this.grids.find(grid => grid.id === startId) || null;
        if (this.exportOptions) {
            this.options = Object.assign(this.options, this.exportOptions);
        }
        this.calcBackupInfo();
    }
}
</script>

<style scoped>
.row {
    margin-bottom: 1em;
}
</style>
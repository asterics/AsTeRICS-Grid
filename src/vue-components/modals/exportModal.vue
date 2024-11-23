<template>
    <modal :title="$t('exportToFile')">
        <template #default>
            <div class="row mb-4">
                <label class="col-12 col-md-2" for="selectGrid">{{ $t('selectGrid') }}</label>
                <div class="col-12 col-md-4 mb-4">
                    <select class="col-12" id="selectGrid" v-model="selectedGrid" @change="selectedGridChanged">
                        <option :value="null">{{ $t('allGrids') }}</option>
                        <option v-for="elem in graphList" :value="elem.grid">{{elem.grid.label | extractTranslation}}</option>
                    </select>
                </div>
                <div class="col-12 col-md-4">
                    <img v-if="selectedGrid && selectedGrid.thumbnail" :src="selectedGrid.thumbnail.data">
                </div>
            </div>
            <div class="row">
                <label class="col-12 col-md-2" for="selectExportLang">{{ $t('exportLanguages') }}</label>
                <div class="col-12 col-md-4 mb-4">
                    <select class="col-12" id="selectExportLang" v-model="options.exportLang">
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
                    <input id="exportDictionaries" type="checkbox" v-model="options.exportDictionaries"/>
                    <label for="exportDictionaries">{{ $t('exportDictionaries') }}</label>
                </div>
            </div>
            <div class="row">
                <div>
                    <input id="exportUserSettings" type="checkbox" v-model="options.exportUserSettings"/>
                    <label for="exportUserSettings">{{ $t('exportUserSettingsAndInputConfig') }}</label>
                </div>
            </div>
            <div class="row">
                <div>
                    <input id="exportGlobalGrid" type="checkbox" v-model="options.exportGlobalGrid"/>
                    <label for="exportGlobalGrid">{{ $t('exportGlobalGrid') }}</label>
                </div>
            </div>
            <div class="row">
                <div>
                    <input id="exportOBZ" type="checkbox" v-model="options.exportOBZ"/>
                    <label for="exportOBZ">{{ $t('exportOBZ') }}</label>
                </div>
            </div>
            <div class="row" v-show="selectedGrid && allChildren && allChildren.length > 0">
                <div>
                    <input id="exportConnected" type="checkbox" v-model="options.exportConnected"/>
                    <label for="exportConnected">
                        <span>{{ $t('exportAllChildGrids') }}</span>
                        <span>({{allChildren ? allChildren.length : 0}} <span>{{ $t('grids') }}</span>)</span>
                    </label>
                </div>
            </div>
        </template>
        <template #ok-button>
            <button 
                @click="save"
                @keydown.ctrl.enter="save"
                :aria-label="$t('downloadBackup')"
                :title="$t('keyboardCtrlEnter')"
                >
                    <i class="fas fa-check" aria-hidden="true"></i>
                    {{ $t('downloadBackup') }}
            </button>
        </template>
    </modal>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import { modalMixin } from '../mixins/modalMixin.js';
    import {helpService} from "../../js/service/helpService";
    import {gridUtil} from "../../js/util/gridUtil.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {localStorageService} from "../../js/service/data/localStorageService.js";
    import {util} from "../../js/util/util.js";
    import { MainVue } from '../../js/vue/mainVue';

    let constants = {
        LANG_EXPORT_CURRENT: 'LANG_EXPORT_CURRENT',
        LANG_EXPORT_ALL: 'LANG_EXPORT_ALL'
    }


    export default {
        mixins: [modalMixin],
        data: function () {
            return {
                selectedGrid: null,
                globalGridId: null,
                graphList: [],
                allChildren: null,
                options: {
                    exportConnected: true,
                    exportDictionaries: true,
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
        watch: {
            'exportOptions.gridId'(id) {
                this.initializeExport(id);
            }
        },
        computed: {
            currentLanguages: function () {
                let grids = this.selectedGrid ? [this.selectedGrid] : this.gridsData;
                let langs = [];
                for (let grid of grids) {
                    for (let element of grid.gridElements) {
                        langs = [...new Set(langs.concat(Object.keys(element.label)))];
                    }
                }
                return langs;
            },
            exportOptions() {
                return this.$store.state.exportOptions;
            },
            gridsData() {
                return this.$store.state.grids;
            }
        },
        methods: {
            selectedGridChanged() {
                if (!this.selectedGrid) {
                    return;
                }
                this.allChildren = gridUtil.getAllChildrenRecursive(this.graphList, this.selectedGrid.id);
            },
            save() {
                let gridIds = this.selectedGrid ? [this.selectedGrid.id] : this.gridsData.map(grid => grid.id);
                if (this.selectedGrid && this.options.exportConnected) {
                    gridIds = gridIds.concat(this.allChildren.map(grid => grid.id));
                }

                let user = localStorageService.getAutologinUser();
                let filename = null;
                if (gridIds.length === 1 && this.selectedGrid) {
                    filename = `${user}_${util.getCurrentDateTimeString()}_${i18nService.getTranslation(this.selectedGrid.label)}`;
                } else {
                    filename = `${user}_${util.getCurrentDateTimeString()}_asterics-grid-custom-backup`;
                }
                dataService.downloadToFile(gridIds, {
                    exportGlobalGrid: this.options.exportGlobalGrid,
                    exportOnlyCurrentLang: this.options.exportLang === constants.LANG_EXPORT_CURRENT,
                    exportDictionaries: this.options.exportDictionaries,
                    exportUserSettings: this.options.exportUserSettings,
                    filename: filename,
                    obzFormat: this.options.exportOBZ,
                    progressFn: (percent, text) => {
                        MainVue.showProgressBar(percent, {
                            header: i18nService.t('exportToFile'),
                            text: text
                        });
                    }
                });
                this.$emit('close');
            },
            openHelp() {
                helpService.openHelp();
            },
            initializeExport(id) {
                if (!id) {
                    this.selectedGrid = null;
                } else {
                    dataService.getGlobalGrid().then(globalGrid => {
                        this.globalGridId = globalGrid ? globalGrid.id : null;
                        this.graphList = gridUtil.getGraphList(this.gridsData, this.globalGridId, true);
                    
                        for (let elem of this.graphList) {
                            if (id === elem.grid.id) {
                                this.selectedGrid = elem.grid;
                                this.selectedGridChanged();
                            }
                        }
                        
                        if (this.exportOptions) {
                            this.options = Object.assign(this.options, this.exportOptions);
                        }
                    });
                }
            }
        },
        mounted() {
            this.initializeExport(this.exportOptions.gridId);
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
.row {
    margin-bottom: 1em;
}

.modal-container {
    min-height: 50vh;
}
</style>
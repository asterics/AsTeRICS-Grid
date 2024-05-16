<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container modal-container-flex" @keydown.esc="$emit('close')" @keydown.ctrl.enter="save()">
                    <div class="container-fluid px-0 mb-5">
                        <div class="row">
                            <div class="modal-header col-8 col-sm-10 col-md-10">
                                <h1 class="inline">{{ $t('exportToFile') }}</h1>
                            </div>
                            <a class="col-2 col-sm-1 col-md black" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                            <a class="col-2 col-sm-1 col-md black" href="javascript:void(0);" :title="$t('closeModal')" @click="$emit('close')"><i class="fas fa-times"/></a>
                        </div>
                    </div>

                    <div class="modal-body mt-2">
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
                    </div>

                    <div class="modal-footer modal-footer-flex">
                        <div class="button-container srow">
                            <button class="six columns" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="six columns" @click="save()" :title="$t('keyboardCtrlEnter')">
                                <i class="fas fa-check"/> <span>{{ $t('downloadBackup') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import './../../css/modal.css';
    import {helpService} from "../../js/service/helpService";
    import {gridUtil} from "../../js/util/gridUtil.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {localStorageService} from "../../js/service/data/localStorageService.js";
    import {util} from "../../js/util/util.js";

    let constants = {
        LANG_EXPORT_CURRENT: 'LANG_EXPORT_CURRENT',
        LANG_EXPORT_ALL: 'LANG_EXPORT_ALL'
    }


    export default {
        props: ['gridsData', 'exportOptions'],
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
                    obzFormat: this.options.exportOBZ
                });
                this.$emit('close');
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted() {
            dataService.getGlobalGrid().then(globalGrid => {
                this.globalGridId = globalGrid ? globalGrid.id : null;
                this.graphList = gridUtil.getGraphList(this.gridsData, this.globalGridId, true);
                if (this.exportOptions.gridId) {
                    for (let elem of this.graphList) {
                        if (this.exportOptions.gridId === elem.grid.id) {
                            this.selectedGrid = elem.grid;
                            this.selectedGridChanged();
                        }
                    }
                }
                if (this.exportOptions) {
                    this.options = Object.assign(this.options, this.exportOptions);
                }
            });
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
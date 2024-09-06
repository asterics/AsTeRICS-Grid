<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container modal-container-flex" @keydown.esc="$emit('close')" @keydown.ctrl.enter="save()">
                    <div class="container-fluid px-0">
                        <div class="row">
                            <div class="modal-header col-8 col-sm-10 col-md-10">
                                <h1 class="inline">{{ $t('importGrids') }}</h1>
                            </div>
                            <a class="col-2 col-sm-1 col-md black" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                            <a class="col-2 col-sm-1 col-md black" href="javascript:void(0);" :title="$t('close')" @click="$emit('close')"><i class="fas fa-times"/></a>
                        </div>
                    </div>

                    <div class="modal-body mt-1">
                        <nav-tabs :tab-labels="[tab_constants.TAB_IMPORT_FILE, tab_constants.TAB_IMPORT_ONLINE]" v-model="currentTab"></nav-tabs>
                        <div v-if="currentTab === tab_constants.TAB_IMPORT_FILE">
                            <div class="row">
                                <div class="col-12 col-md-6 mb-2">
                                    <label class="me-3" for="fileInput">{{ $t('selectFile') }}</label>
                                    <input id="fileInput" type="file" @change="fileChanged" accept=".grd, .txt"/>
                                </div>
                                <div class="col-12 col-md-6" v-if="file && !importData">{{ $t('backupFileDoesntContainData') }}</div>
                                <div class="col-12 col-md-6" v-if="importData">
                                    <ul>
                                        <li v-if="hasGrids">
                                            <span :title="importData.grids.map(g => i18nService.getTranslation(g.label))">{{importData.grids.length}} grid(s)</span>
                                        </li>
                                        <li v-if="hasDictionaries">
                                            <span :title="importData.dictionaries.map(d => d.dictionaryKey)">{{ $t('numDictionaries', {length: importData.dictionaries.length}) }}</span>
                                        </li>
                                        <li v-if="hasUserSettings">{{ $t('userSettings') }}</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="row" v-if="hasDictionaries">
                                <div>
                                    <input id="importDictionaries" type="checkbox" v-model="options.importDictionaries"/>
                                    <label for="importDictionaries">{{ $t('importDictionaries') }}</label>
                                </div>
                            </div>
                            <div class="row" v-if="hasUserSettings">
                                <div>
                                    <input id="importUserSettings" type="checkbox" v-model="options.importUserSettings"/>
                                    <label for="importUserSettings">{{ $t('importUserSettings') }}</label>
                                </div>
                            </div>
                            <div class="row" v-if="importData && !hasGlobalGrid">
                                <div>
                                    <input id="generateGlobalGrid" type="checkbox" v-model="options.generateGlobalGrid"/>
                                    <label for="generateGlobalGrid">{{ $t('generateGlobalGrid') }}</label>
                                </div>
                            </div>
                            <div class="row">
                                <div>
                                    <input id="resetBeforeImport" type="checkbox" v-model="options.resetBeforeImport"/>
                                    <label for="resetBeforeImport">{{ $t('deleteExistingDataBeforeImporting') }}</label>
                                </div>
                            </div>
                        </div>
                        <div v-if="currentTab === tab_constants.TAB_IMPORT_ONLINE">
                            <import-modal-tab-online/>
                        </div>
                    </div>

                    <div class="modal-footer modal-footer-flex">
                        <div class="button-container srow">
                            <button class="six columns" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="six columns" @click="save()" :disabled="!this.importData" :title="$t('keyboardCtrlEnter')">
                                <i class="fas fa-check"/> <span>{{ $t('importData') }}</span>
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
    import {i18nService} from "../../js/service/i18nService.js";
    import {MainVue} from "../../js/vue/mainVue.js";
    import NavTabs from '../components/nav-tabs.vue';
    import ImportModalTabOnline from './importModalTabOnline.vue';

    let tab_constants = {
        TAB_IMPORT_FILE: 'TAB_IMPORT_FILE',
        TAB_IMPORT_ONLINE: 'TAB_IMPORT_ONLINE'
    }

    export default {
        components: { ImportModalTabOnline, NavTabs },
        props: ['gridsData', 'reloadFn'],
        data: function () {
            return {
                data: null,
                file: null,
                importData: null,
                options: {
                    importDictionaries: true,
                    importUserSettings: true,
                    generateGlobalGrid: false,
                    resetBeforeImport: false
                },
                currentTab: tab_constants.TAB_IMPORT_FILE,
                tab_constants: tab_constants,
                i18nService: i18nService
            }
        },
        computed: {
            hasGrids() {
                return this.importData && this.importData.grids && this.importData.grids.length > 0;
            },
            hasDictionaries() {
                return this.importData && this.importData.dictionaries && this.importData.dictionaries.length > 0;
            },
            hasUserSettings() {
                return this.importData && this.importData.metadata && this.importData.metadata.inputConfig;
            },
            hasGlobalGrid() {
                return this.hasGrids && this.importData.metadata && this.importData.metadata.globalGridId && this.importData.grids.map(g => g.id).includes(this.importData.metadata.globalGridId);
            }
        },
        methods: {
            async fileChanged(event) {
                this.file = event.target.files[0];
                this.importData = null;
                if (this.file) {
                    this.importData = await dataService.convertFileToImportData(this.file);
                }
            },
            async save() {
                if (!this.importData || (this.options.resetBeforeImport && !confirm(i18nService.t("doYouWantToDeleteBeforeImporting")))) {
                    return;
                }
                this.$emit('close');
                if (this.options.resetBeforeImport) {
                    MainVue.showProgressBar(0, {
                        header: i18nService.t('importGrids'),
                        text: i18nService.t('deletingGrids')
                    });
                    await dataService.deleteAllGrids();
                    await dataService.deleteAllDictionaries();
                }
                MainVue.showProgressBar(20, {
                    header: i18nService.t('importGrids'),
                    text: i18nService.t('importingData')
                });
                await dataService.importData(this.importData, {
                    importDictionaries: this.options.importDictionaries,
                    importUserSettings: this.options.importUserSettings,
                    generateGlobalGrid: this.options.generateGlobalGrid,
                    resetBeforeImport: this.options.resetBeforeImport,
                    progressFn: p => {
                        MainVue.showProgressBar(20 + Math.round(p / 100 * 80), {
                            header: i18nService.t('importGrids'),
                            text: i18nService.t('importingData')
                        });
                    }
                });
                if (this.options.resetBeforeImport) {
                    await dataService.markCurrentConfigAsBackedUp();
                }
                MainVue.showProgressBar(100);
                if (this.reloadFn) {
                    this.reloadFn();
                }
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted() {
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
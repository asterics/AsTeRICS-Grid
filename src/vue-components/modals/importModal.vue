<template>
    <modal :title="$t('importDataFromFile')" :help-fn="openHelp">
        <template>
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
        </template>
        <template #ok-button>
            <button
                @click="save"
                @keydown.ctrl.enter="save"
                :aria-label="$t('importData')"
                :title="$t('keyboardCtrlEnter')"
                :disabled="!importData"
                >
                <i class="fas fa-check" aria-hidden="true"></i>
                {{ $t('importData') }}
            </button>
        </template>
    </modal>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import { modalMixin } from '../mixins/modalMixin.js';
    import {helpService} from "../../js/service/helpService";
    import {i18nService} from "../../js/service/i18nService.js";
    import {MainVue} from "../../js/vue/mainVue.js";

    export default {
        mixins: [modalMixin],
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
                if (this.options.resetBeforeImport) {
                    MainVue.showProgressBar(0, {
                        header: i18nService.t('importDataFromFile'),
                        text: i18nService.t('deletingGrids')
                    });
                    await dataService.deleteAllGrids();
                    await dataService.deleteAllDictionaries();
                }
                MainVue.showProgressBar(20, {
                    header: i18nService.t('importDataFromFile'),
                    text: i18nService.t('importingData')
                });
                await dataService.importData(this.importData, {
                    importDictionaries: this.options.importDictionaries,
                    importUserSettings: this.options.importUserSettings,
                    generateGlobalGrid: this.options.generateGlobalGrid,
                    resetBeforeImport: this.options.resetBeforeImport,
                    progressFn: p => {
                        MainVue.showProgressBar(20 + Math.round(p / 100 * 80), {
                            header: i18nService.t('importDataFromFile'),
                            text: i18nService.t('importingData')
                        });
                    }
                });
                if (this.options.resetBeforeImport) {
                    await dataService.markCurrentConfigAsBackedUp();
                }
                this.$emit('reload');
                this.$emit('close');
            },
            openHelp() {
                helpService.openHelp();
            }
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
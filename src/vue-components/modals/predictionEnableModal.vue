<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" role="dialog" aria-modal="true" :aria-labelledby="'pred-enable-title'" :aria-describedby="'pred-enable-body'">
                    <a class="inline close-button" href="javascript:void(0);" @click="skip()" :title="$t('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 id="pred-enable-title">{{ $t('prediction.enableTitle') }}</h1>
                    </div>

                    <div class="modal-body">
                        <p id="pred-enable-body">{{ $t('prediction.enableBody') }}</p>

                        <div v-if="suggestion" class="srow" style="border: 1px solid #ddd; border-radius: 6px; padding: 0.8em;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600">{{ $t('prediction.suggested') }}</div>
                                    <div>{{ suggestion.name }}</div>
                                    <small>{{ $t('prediction.backupNote') }}</small>
                                </div>
                                <div>
                                    <button :disabled="!isOnline || loading" @click="importSuggested()">
                                        <i class="fas fa-download"/>
                                        <span>{{ $t('prediction.importSuggested', { dictName: suggestion.name }) }}</span>
                                    </button>
                                </div>
                            </div>
                            <div v-if="!isOnline" class="mt-1" style="color:#a00">{{ $t('prediction.offline') }}</div>
                            <div v-if="loading" class="mt-1"><i class="fas fa-spinner fa-spin"/> <span>{{ loadingText }}</span></div>
                            <div v-if="error" class="mt-1" style="color:#a00">{{ error }}</div>
                        </div>

                        <div class="srow" style="display:flex; gap: 0.5em; flex-wrap: wrap;">
                            <button class="secondary" @click="chooseDifferent()"><i class="fas fa-list"/> <span>{{ $t('prediction.chooseDifferent') }}</span></button>
                            <button class="secondary" @click="skip()"><i class="fas fa-times"/> <span>{{ $t('prediction.skip') }}</span></button>
                        </div>

                        <div class="srow">
                            <label><input type="checkbox" v-model="dontAskAgain"/> {{ $t('prediction.dontAskAgain') }}</label>
                        </div>

                        <import-dictionary-modal v-if="showSelector" :dicts="dicts" @close="showSelector=false" @reload="onImported"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import { i18nService } from '../../js/service/i18nService';
    import { dataService } from '../../js/service/data/dataService';
    import { localStorageService } from '../../js/service/data/localStorageService';
    import { predictionService } from '../../js/service/predictionService';
    import ImportDictionaryModal from './importDictionaryModal.vue';
    import Predictionary from 'predictionary';
    import { getDictionaryCatalogOptions, findBestDictionaryForCandidates } from '../../js/service/dictionaryCatalog';


    export default {
        props: ['options'],
        components: { ImportDictionaryModal },
        data() {
            return {
                suggestion: null,
                dontAskAgain: false,
                loading: false,
                loadingText: '',
                error: '',
                showSelector: false,
                dicts: [],
                catalogOptions: []
            };
        },
        computed: {
            isOnline() {
                return typeof navigator !== 'undefined' ? navigator.onLine : true;
            }
        },
        methods: {
            async importSuggested() {
                if (!this.suggestion) return;
                if (!this.isOnline) return;
                this.error = '';
                this.loading = true;
                this.loadingText = i18nService.t('prediction.downloading', { dictName: this.suggestion.name });
                try {
                    let dictData;
                    if (this.suggestion.type === 'GITHUB_FREQUENCYWORDS') {
                        const raw = await this.requestDict(this.suggestion.downloadUrl, this.suggestion.downloadUrl2);
                        const pred = Predictionary.instance();
                        pred.parseWords(raw, { elementSeparator: '\n', rankIsIndex: true });
                        dictData = pred.dictionaryToJSON();
                    } else {
                        dictData = await this.requestDict(this.suggestion.downloadUrl);
                    }
                    this.loadingText = i18nService.t('prediction.installing');
                    const { Dictionary } = await import('../../js/model/Dictionary');
                    const { modelUtil } = await import('../../js/util/modelUtil');
                    const existing = await dataService.getDictionaries();
                    const existingNames = existing.map(d => d.dictionaryKey);
                    const dict = new Dictionary({
                        dictionaryKey: modelUtil.getNewName(this.suggestion.name, existingNames),
                        data: dictData,
                        isDefault: true,
                        lang: this.suggestion.lang
                    });
                    await dataService.saveDictionary(dict);
                    await predictionService.init();
                    this.notifyInstalled();
                    this.persistPrefIfChecked();
                    this.$emit('close');
                } catch (e) {
                    this.error = i18nService.t('prediction.error');
                } finally {
                    this.loading = false;
                    this.loadingText = '';
                }
            },
            chooseDifferent() {
                this.persistPrefIfChecked();
                this.showSelector = true;
            },
            skip() {
                this.persistPrefIfChecked();
                this.$emit('close');
            },
            onImported() {
                // When a dictionary was imported via selector
                this.showSelector = false;
                this.$emit('close');
            },
            persistPrefIfChecked() {
                if (this.dontAskAgain) {
                    localStorageService.saveUserSettings({ askForDictOnPrediction: false });
                }
            },
            requestDict(url, secondTryUrl) {
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: url,
                        dataType: 'text',
                        accepts: { text: 'application/vnd.github.v3.raw' }
                    }).then(result => resolve(result)).fail(() => {
                        if (!secondTryUrl) {
                            return reject(i18nService.t('couldNotDownloadDictCheckInternet'));
                        }
                        this.requestDict(secondTryUrl).then(resolve).catch(reject);
                    });
                });
            },
            notifyInstalled() {
                try {
                    const { MainVue } = require('../../js/vue/mainVue');
                    MainVue.setTooltip(i18nService.t('prediction.installed'), { timeoutMs: 4000 });
                } catch (e) {}
            },
            computeSuggestion(candidates) {
                const options = this.catalogOptions && this.catalogOptions.length ? this.catalogOptions : getDictionaryCatalogOptions();
                const suggestion = findBestDictionaryForCandidates(candidates, options);
                if (!suggestion) {
                    return {
                        lang: 'en',
                        name: i18nService.t('astericsGridEnglishDefault'),
                        type: 'OPTION_TYPE_PREDEFINED',
                        downloadUrl: 'https://raw.githubusercontent.com/asterics/AsTeRICS-Grid/master/app/dictionaries/default_en.json'
                    };
                }
                const type = (suggestion.type && suggestion.type.indexOf('GITHUB') >= 0) ? 'GITHUB_FREQUENCYWORDS' : 'PREDEFINED';
                return { lang: suggestion.lang, name: suggestion.name, type, downloadUrl: suggestion.downloadUrl, downloadUrl2: suggestion.downloadUrl2 };
            }
        },
        async created() {
            const cands = (this.options && this.options.candidates) || [];
            this.catalogOptions = getDictionaryCatalogOptions();
            this.suggestion = this.computeSuggestion(cands);
            // load dicts for embedded selector
            try {
                this.dicts = await dataService.getDictionaries();
            } catch (e) {
                this.dicts = [];
            }
        }
    };
</script>

<style scoped>
.modal-container { min-height: 30vh; }
.secondary { background: transparent; border: 1px solid #999; }
.mt-1 { margin-top: 0.5em; }
.srow { margin-top: 0.8em; }
</style>


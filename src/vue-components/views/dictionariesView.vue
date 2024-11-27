<template>
    <div class="overflow-content box">
        <div :aria-hidden="showImportModal">
            <div class="all-dicts-view">
                <header class="srow header" role="toolbar">
                    <header-icon></header-icon>
                    <button tabindex="32" @click="addDictionary()" :aria-label="$t('newEmptyDictionary')" class="small spaced"><i class="fas fa-plus"/> <span class="hide-mobile">{{ $t('newEmptyDictionary') }}</span></button>
                    <button tabindex="31" @click="showImportModal = true" :aria-label="$t('importDictionary')" class="small spaced"><i class="fas fa-file-import"/> <span class="hide-mobile">{{ $t('importDictionary') }}</span></button>
                </header>
                <div class="srow content text-content">
                    <div v-if="!dicts" class="grid-container grid-mask">
                        <i class="fas fa-4x fa-spinner fa-spin"/>
                    </div>
                    <h2>{{ $t('savedDictionaries') }}</h2>
                    <ul id="dictList" v-show="dicts && dicts.length > 0">
                        <li class="hide-mobile table-headers">
                            <span class="four columns">{{ $t('dictionaryName') }}</span>
                            <span class="four columns">{{ $t('actions') }}</span><br/>
                        </li>
                        <li v-for="dict in dicts" class="dict-table-elem">
                            <div class="srow">
                                <div class="four columns">
                                    <div v-if="editModeId !== dict.id">
                                        {{ dict.dictionaryKey }}
                                        <button class="small-button" :title="$t('editName')" @click="enableEditName(dict)"><i class="far fa-edit"/>
                                        </button>
                                    </div>
                                    <div v-if="editModeId === dict.id">
                                        <input type="text" v-focus="" v-model="dict.dictionaryKey"/>
                                        <div class="inline">
                                            <button class="small-button" :title="$t('cancelEditName')" v-if="originalLabel" @click="cancelEditName()"><i
                                                class="fas fa-times"/></button>
                                            <button class="small-button" :title="$t('saveName')" @click="finishEditName(dict)"
                                                    :disabled="isLabelDuplicate(dict.dictionaryKey)"><i class="fas fa-check"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="eight columns actionbuttons" style="display: flex; padding-right: 1em">
                                    <div class="four columns show-mobile" style="margin: 0.5em 0 0 0.2em">{{ $t('actions') }}
                                    </div>
                                    <button @click="edit(dict)" :aria-label="$t('edit')"><i class="far fa-edit"/> <span class="hide-mobile">{{ $t('edit') }}</span>
                                    </button>
                                    <button @click="clone(dict.id)" :aria-label="$t('clone')"><i class="far fa-clone"/> <span class="hide-mobile"
                                    >{{ $t('clone') }}</span>
                                    </button>
                                    <button @click="deleteDict(dict.id, dict.dictionaryKey)" :aria-label="$t('delete')"><i class="far fa-trash-alt"/> <span
                                        class="hide-mobile">{{ $t('delete') }}</span></button>
                                    <button @click="downloadDict(dict.id, dict.dictionaryKey)" :aria-label="$t('save')"><i class="fas fa-download"/> <span
                                        class="hide-mobile">{{ $t('save') }}</span></button>
                                </div>
                            </div>
                            <div class="edit-container" v-if="editId === dict.id">
                                <div class="srow">
                                    <label class="three columns">{{ $t('language') }}</label>
                                    <select class="four columns" v-model="dict.lang">
                                        <option v-for="lang in languages" :value="lang.code">{{ lang | extractTranslation }}</option>
                                    </select>
                                    <button @click="handleImportWords(dict)" class="five columns">
                                        <i class="fas fa-file-import"/>
                                        <span>{{ $t('importWords') }}</span>
                                    </button>
                                </div>
                                <div class="srow mt-3 mb-4">
                                    <search-bar v-model="searchWord" placeholder="searchWord" @input="inputSearchWord()"></search-bar>
                                </div>
                                <div class="srow">
                                    <span>{{ $t('words') }}</span>
                                    <ul style="margin-left: 0">
                                        <li v-for="word in wordlist">
                                            <button class="small-button" :title="$t('deleteWordParam', [word])" @click="deleteWord(word, dict)" style="margin-right: 0.5em"><i class="far fa-trash-alt"/></button>
                                            <span>{{word}}</span>
                                        </li>
                                    </ul>
                                    <span v-show="totalWords > wordlist.length && searchWord === ''">
                                    {{totalWords - wordlist.length}}
                                    <span>{{ $t('moreWordsAvailableTypeInSearchFieldToFilter') }}</span>
                                </span>
                                    <span v-show="filterWords > wordlist.length && searchWord !== ''">
                                    {{filterWords - wordlist.length}}
                                    <span>{{ $t('moreWordsForThisFilterRefineSearchToShowMore') }}</span>
                                </span>
                                    <div v-show="searchWord && totalWords > 0 && wordlist.length === 0">
                                        <span>{{ $t('noWordsForThisFilterClearSearchField') }}</span>
                                        <button @click="inputSearchWord('')"><i class="fas fa-times"/> <span>{{ $t('clear') }}</span></button>
                                    </div>
                                    <span v-show="totalWords === 0">{{ $t('thisDictionaryContainsNoWords') }}</span>
                                </div>
                            </div>
                        </li>
                    </ul>
                    <p v-if="!dicts || dicts.length === 0">
                        {{ $t('noDictionariesFound') }}
                    </p>
                </div>
                <div class="bottom-spacer"></div>
            </div>
        </div>
        <import-words-modal ref="words" v-bind:dict-data="modalDict" @reload="reload"/>
        <import-dictionary-modal v-if="showImportModal" :dicts="dicts"
                                 @close="showImportModal = false" @reload="reload"/>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import FileSaver from 'file-saver';
    import {dataService} from "../../js/service/data/dataService";
    import {modelUtil} from "../../js/util/modelUtil";
    import {i18nService} from "../../js/service/i18nService";
    import {predictionService} from "../../js/service/predictionService";
    import {constants} from "../../js/util/constants";
    import {util} from "../../js/util/util";
    import {Dictionary} from "../../js/model/Dictionary";
    import Predictionary from 'predictionary'
    import ImportWordsModal from '../modals/importWordsModal.vue'
    import ImportDictionaryModal from '../modals/importDictionaryModal.vue'
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {helpService} from "../../js/service/helpService";
    import SearchBar from '../components/searchBar.vue';

    let vueApp = null;
    let vueConfig = {
        data() {
            return {
                dicts: null,
                modalDict: null,
                editModeId: '',
                editId: null,
                originalLabel: '',
                showLoading: true,
                predictionary: null,
                wordlist: [],
                searchWord: "",
                showImportModal: false,
                totalWords: 0,
                filterWords: 0,
                languages: i18nService.getAllLanguages()
            };
        },
        components: {
            SearchBar,
            ImportDictionaryModal, ImportWordsModal, HeaderIcon
        },
        methods: {
            handleImportWords(dict) {
                this.modalDict = dict;
                this.$refs.words.openModal();
            },
            deleteDict: function (id, label) {
                let thiz = this;
                if (!confirm(i18nService.t('CONFIRM_DELETE_DICT', label))) {
                    return;
                }
                dataService.deleteObject(id).then(() => {
                    thiz.reload();
                });
            },
            downloadDict: function (id, label) {
                let blob = new Blob([this.dicts.filter(d => d.id === id)[0].data], {type: "application/json;charset=utf-8"});
                FileSaver.saveAs(blob, `dictionary-${label}.json`);
            },
            addDictionary: function () {
                log.debug('add dictionary!');
                let existingNames = this.dicts.map(dict => dict.dictionaryKey);
                let dictData = new Dictionary({
                    dictionaryKey: modelUtil.getNewName('newDictionary', existingNames),
                    lang: i18nService.getContentLang()
                });
                dataService.saveDictionary(dictData).then(() => {
                    this.editModeId = dictData.id;
                    this.reload();
                });
            },
            finishEditName: function (dict) {
                dataService.saveDictionary(dict);
                this.editModeId = '';
                this.originalLabel = '';
            },
            enableEditName: function (dict) {
                this.cancelEditName();
                this.editModeId = dict.id;
                this.originalLabel = dict.dictionaryKey;
            },
            cancelEditName: function () {
                if (this.editModeId) {
                    let dict = this.dicts.filter(d => d.id === this.editModeId)[0];
                    dict.dictionaryKey = this.originalLabel || dict.dictionaryKey;
                }
                this.editModeId = '';
                this.originalLabel = '';
            },
            isLabelDuplicate: function (label) {
                return this.dicts.map(g => g.dictionaryKey).filter(l => l === label).length > 1
            },
            show(dictId) {
            },
            edit(dict) {
                this.cancelEditName();
                if (this.editId === dict.id) {
                    this.editFinished();
                    return;
                }
                this.editId = dict.id;
                this.predictionary = Predictionary.instance();
                this.predictionary.loadDictionary(dict.data);
                this.totalWords = this.predictionary.getWords().length;
                this.inputSearchWord('');
                helpService.setHelpLocation('07_dictionaries', '#edit-dictionaries');
            },
            editFinished() {
                this.editId = null;
                this.searchWord = "";
                helpService.setHelpLocation('02_navigation', '#manage-dictionaries-view');
            },
            inputSearchWord(input) {
                let thiz = this;
                let timeout = input === undefined ? 200 : 0;
                util.debounce(function () {
                    thiz.searchWord = input === undefined ? thiz.searchWord : input;
                    let suggestions = thiz.predictionary.predict(thiz.searchWord, {maxPredicitons: 10000});
                    thiz.filterWords = suggestions.length;
                    thiz.wordlist = suggestions.slice(0, 9);
                }, timeout, util.DEFAULT_KEY2);
            },
            clone(dictId) {
                let thiz = this;
                dataService.getDictionary(dictId).then(dict => {
                    dataService.saveDictionary(dict.clone()).then(() => {
                        thiz.reload();
                    });
                })
            },
            deleteWord(word, dict) {
                let thiz = this;
                thiz.predictionary.delete(word);
                this.totalWords = this.predictionary.getWords().length;
                util.debounce(function () {
                    dict.data = thiz.predictionary.dictionaryToJSON();
                    dataService.saveDictionary(dict);
                }, 2000, util.DEFAULT_KEY);
                thiz.inputSearchWord();
            },
            reload: function (dictData) {
                let thiz = this;
                dataService.getDictionaries().then(dicts => {
                    this.dicts = JSON.parse(JSON.stringify(dicts));
                    if (thiz.editId && dictData && dictData.data) {
                        thiz.editFinished();
                        thiz.edit(dictData);
                    }
                });
            },
            updatedHandler(event, updatedIds, updatedDocs) {
                if (updatedDocs[0].modelName === Dictionary.getModelName()) {
                    this.reload(updatedDocs[0]);
                }
            }
        },
        created() {
            let thiz = this;
            $(document).on(constants.EVENT_DB_PULL_UPDATED, thiz.updatedHandler);
            dataService.getDictionaries().then(dicts => {
                log.debug(dicts);
                thiz.dicts = JSON.parse(JSON.stringify(dicts)); //hack because otherwise vueJS databinding sometimes does not work;
                thiz.showLoading = false;
            });
        },
        mounted() {
            let thiz = this;
            vueApp = thiz;
        },
        beforeDestroy() {
            predictionService.init();
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.updatedHandler);
        }
    };

    export default vueConfig;
</script>

<style scoped>
    input {
        margin-bottom: 1em;
    }

    .all-dicts-view li {
        list-style-type: none;
    }

    .all-dicts-view a {
        font-size: 1.2em;
    }

    .actionbuttons button {
        width: 25%;
        padding: 0 1vh;
        margin: 0.5vh 0.5vw;
    }

    .all-dicts-view .small-button {
        padding: 0;
        margin-left: 0.5em;
        line-height: normal;
        width: 25px;
        height: 25px;
    }

    .all-dicts-view .table-headers {
        margin-top: 1.0em;
    }

    .edit-container {
        padding: 1em;
    }

    @media (min-width: 751px) {
        .edit-container {
            background-color: whitesmoke;
            margin-right: 1em;
            padding: 1em;
        }
    }

    /* Smaller than tablet */
    @media (max-width: 850px) {
        .all-dicts-view a {
            font-size: 1.3em;
            margin-top: 1.5em;
        }

        .all-dicts-view input[type="text"] {
            height: 1.3em;
            font-size: 1.3em;
        }

        .all-dicts-view .small-button {
            width: 30px;
            height: 30px;
        }

        .dict-table-elem {
            outline: 1px solid lightgray;
            padding: 0.5em;
            margin-right: 1em;
        }
    }
</style>
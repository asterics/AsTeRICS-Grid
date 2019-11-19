<template>
    <div class="overflow-content box">
        <div class="all-dicts-view">
            <header class="row header" role="banner">
                <header-icon></header-icon>
                <button @click="addDictionary()"><i class="fas fa-plus"/> <span data-i18n="">New Dictionary // Neues Wörterbuch</span></button>
            </header>
            <div class="row content text-content">
                <div v-if="!dicts" class="grid-container grid-mask">
                    <i class="fas fa-4x fa-spinner fa-spin"/>
                </div>
                <h2 data-i18n>Saved Dictionaries // Gespeicherte Wörterbücher</h2>
                <ul id="dictList" v-show="dicts && dicts.length > 0">
                    <li class="hide-mobile table-headers">
                        <span class="four columns">Dictionary Name</span>
                        <span class="four columns" data-i18n="">Actions // Aktionen</span><br/>
                    </li>
                    <li v-for="dict in dicts" class="dict-table-elem">
                        <div class="row">
                            <div class="four columns">
                                <div v-if="editModeId !== dict.id">
                                    {{ dict.dictionaryKey }}
                                    <button class="small-button" @click="enableEditName(dict)"><i class="far fa-edit"/>
                                    </button>
                                </div>
                                <div v-if="editModeId === dict.id">
                                    <input type="text" v-focus="" v-model="dict.dictionaryKey"/>
                                    <div class="inline">
                                        <button class="small-button" v-if="originalLabel" @click="cancelEditName()"><i
                                                class="fas fa-times"/></button>
                                        <button class="small-button" @click="finishEditName(dict)"
                                                :disabled="isLabelDuplicate(dict.dictionaryKey)"><i class="fas fa-check"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="eight columns actionbuttons" style="display: flex;">
                                <div class="four columns show-mobile" style="margin: 0.5em 0 0 0.2em" data-i18n="">Actions
                                    // Aktionen
                                </div>
                                <button @click="edit(dict)"><i class="far fa-edit"/> <span class="hide-mobile" data-i18n="">Edit // Bearbeiten</span>
                                </button>
                                <button @click="clone(dict.id)"><i class="far fa-clone"/> <span class="hide-mobile"
                                                                                                data-i18n="">Clone // Duplizieren</span>
                                </button>
                                <button @click="deleteDict(dict.id, dict.dictionaryKey)"><i class="far fa-trash-alt"/> <span
                                        class="hide-mobile" data-i18n="">Delete // Löschen</span></button>
                            </div>
                        </div>
                        <div class="edit-container" v-if="editId === dict.id">
                            <div class="row">
                                <input type="text" class="four columns" placeholder="Search word" v-model="searchWord"
                                       @input="inputSearchWord()"/>
                                <button @click="showImportModal = true" class="four columns">
                                    <i class="fas fa-file-import"/>
                                    <span data-i18n="">Import words // Wörter importieren</span>
                                </button>
                            </div>
                            <div class="row">
                                <span data-i18n="">Words: // Wörter:</span>
                                <ul style="margin-left: 0">
                                    <li v-for="word in wordlist">
                                        <button class="small-button" @click="deleteWord(word, dict)" style="margin-right: 0.5em"><i class="far fa-trash-alt"/></button>{{word}}
                                    </li>
                                </ul>
                                <span v-show="totalWords > wordlist.length && searchWord === ''">
                                    {{totalWords - wordlist.length}}
                                    <span data-i18n="">more word(s) available. Type in search field to filter. // mehr Wörter verfügbar. Tippe in Suchfeld um zu filtern.</span>
                                </span>
                                <span v-show="filterWords > wordlist.length && searchWord !== ''">
                                    {{filterWords - wordlist.length}}
                                    <span data-i18n="">more word(s) for this filter. Refine search to show more. // mehr Wörter für diese Suche. Verfeinere die Suche um mehr anzuzeigen.</span>
                                </span>
                                <div v-show="searchWord && totalWords > 0 && wordlist.length === 0">
                                    <span data-i18n="">No words for this filter. Clear search field to show elements. // Keine Wörter für diese Suche. Lösche Suchfeld um Elemente anzuzeigen.</span>
                                    <button @click="inputSearchWord('')"><i class="fas fa-times"/> <span data-i18n="">Clear // Löschen</span></button>
                                </div>
                                <span v-show="totalWords === 0" data-i18n="">This dictionary contains no words. // Dieses Wörterbuch enthält keine Wörter.</span>
                            </div>
                        </div>
                        <div>
                            <import-dictionary-modal v-if="showImportModal" v-bind:dict-data="dict"
                                                     @close="showImportModal = false" @reload="reload"/>
                        </div>
                    </li>
                </ul>
                <p v-if="!dicts || dicts.length === 0" data-i18n>
                    No dictionaries found! // Keine Ergebnisse gefunden!
                </p>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from 'jquery';
    import {dataService} from "../../js/service/data/dataService";
    import {modelUtil} from "../../js/util/modelUtil";
    import {i18nService} from "../../js/service/i18nService";
    import {predictionService} from "../../js/service/predictionService";
    import {constants} from "../../js/util/constants";
    import {util} from "../../js/util/util";
    import {Dictionary} from "../../js/model/Dictionary";
    import Predictionary from 'predictionary'
    import ImportDictionaryModal from '../modals/importDictionaryModal.vue'
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {helpService} from "../../js/service/helpService";

    let vueApp = null;
    let vueConfig = {
        data() {
            return {
                dicts: null,
                editModeId: '',
                editId: null,
                originalLabel: '',
                showLoading: true,
                predictionary: null,
                wordlist: [],
                searchWord: "",
                showImportModal: false,
                totalWords: 0,
                filterWords: 0
            };
        },
        components: {
            ImportDictionaryModal, HeaderIcon
        },
        methods: {
            deleteDict: function (id, label) {
                let thiz = this;
                if (!confirm(i18nService.translate('CONFIRM_DELETE_DICT', label))) {
                    return;
                }
                dataService.deleteObject(id).then(() => {
                    thiz.reload();
                });
            },
            addDictionary: function () {
                log.debug('add dictionary!');
                let existingNames = this.dicts.map(dict => dict.dictionaryKey);
                let dictData = new Dictionary({
                    dictionaryKey: modelUtil.getNewName('newDictionary', existingNames),
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
        mounted: function () {
            let thiz = this;
            vueApp = thiz;
            i18nService.initDomI18n();
        },
        updated() {
            i18nService.initDomI18n();
        },
        beforeDestroy() {
            predictionService.init();
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.updatedHandler);
            $.contextMenu('destroy');
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
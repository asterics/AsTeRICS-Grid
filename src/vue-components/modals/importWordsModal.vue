<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <a class="close-button" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Import words to dictionary // Wörter zu Wörterbuch hinzufügen
                        </h1>
                    </div>

                    <div class="modal-body container">
                        <div class="row">
                            <label class="three columns" for="inputText" data-i18n="">Input // Eingabe</label>
                            <span class="nine columns" data-i18n="">Insert Words, separated by space. ";" or [Enter] // Geben Sie Wörter ein, getrennt durch Leertaste, ";" oder [Enter]</span>
                        </div>
                        <div class="row">
                            <button @click="() => {showAdvanced = !showAdvanced}" class="nine columns offset-by-three btn-accordion" style="margin-bottom: 0">
                                <i class="fas fa-chevron-down" v-show="!showAdvanced"></i>
                                <i class="fas fa-chevron-up" v-show="showAdvanced"></i>
                                <span data-i18n="">Advanced options // Erweiterte Einstellungen</span>
                            </button>
                        </div>
                        <div class="row" v-if="showAdvanced">
                            <div class="nine columns offset-by-three" style="background-color: whitesmoke;">
                                <div class="row">
                                    <label for="inputElementSeparator" class="five columns" data-i18n="">Element separator // Trennzeichen Element</label>
                                    <input id="inputElementSeparator" type="text" v-model="elementSeparator" @input="textChanged"/>
                                </div>
                                <div class="row">
                                    <label for="inputRankSeparator" class="five columns" data-i18n="">In-element separator // Trennzeichen innerhalb Element</label>
                                    <input id="inputRankSeparator" type="text" v-model="rankSeparator" @input="textChanged"/>
                                </div>
                                <div class="row">
                                    <label for="inputElIndex" class="five columns" data-i18n="">Word index (0-based) // Index Wort (0-basiert)</label>
                                    <input id="inputElIndex" type="number" v-model="wordPosition" @input="textChanged"/>
                                </div>
                                <div class="row">
                                    <label for="inputRankIndex" class="five columns" data-i18n="">Rank index (0-based) // Index Rank (0-basiert)</label>
                                    <input id="inputRankIndex" type="number" v-model="rankPosition" @input="textChanged"/>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <textarea v-focus class="twelve columns" id="inputText" v-model="inputText" @input="textChanged" style="resize: vertical;min-height: 70px;" placeholder="Word1 Word2 Word3..."/>
                        </div>
                        <div class="row">
                            <label class="three columns" data-i18n>Recognized Words // Erkannte Wörter</label>
                            <div v-show="parsedElems.length > 0" class="nine columns">
                                <span>{{elementCount}}</span>
                                <span data-i18n>Word(s) // Wörter</span>
                                <span class="break-word">{{JSON.stringify(parsedElems)}}</span>
                                <span v-if="parsedElems.length < elementCount">...</span>
                            </div>
                            <div v-show="parsedElems.length === 0" class="nine columns">
                                <span data-i18n>No words // Keine Wörter</span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container">
                            <button @click="$emit('close')" title="Keyboard: [Esc]">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button @click="save()" title="Keyboard: [Ctrl + Enter]" :disabled="parsedElems.length == 0">
                                <i class="fas fa-check"/> <span data-i18n>Insert words // Wörter einfügen</span>
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
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import Predictionary from 'predictionary'
    import {helpService} from "../../js/service/helpService";

    let predictionary = Predictionary.instance();

    export default {
        props: ['dictData'],
        data: function () {
            return {
                inputText: "",
                parsedElems: [],
                elementCount: 0,
                elementSeparator: '[\\n; ]',
                rankSeparator: null,
                wordPosition: null,
                rankPosition: null,
                showAdvanced: false,
                originalPredictionary: null
            }
        },
        methods: {
            textChanged() {
                predictionary = Predictionary.instance();
                this.parseInternal(predictionary);
                this.parsedElems = predictionary.predict('', {maxPredicitons: 20});
                this.elementCount = predictionary.getWords().length;
            },
            save() {
                var thiz = this;
                thiz.parseInternal(this.originalPredictionary);
                thiz.dictData.data = this.originalPredictionary.dictionaryToJSON(this.dictData.dictionaryKey);
                dataService.saveDictionary(thiz.dictData).then(() => {
                    thiz.$emit('reload', thiz.dictData);
                    thiz.$emit('close');
                });
            },
            parseInternal(predictionaryInstance) {
                try {
                    predictionaryInstance.parseWords(this.inputText, {
                        elementSeparator: new RegExp(this.elementSeparator),
                        rankSeparator: new RegExp(this.rankSeparator),
                        wordPosition: this.wordPosition,
                        rankPosition: this.rankPosition,
                        addToDictionary: this.dictData.dictionaryKey
                    });
                } catch (e) {
                    log.warn('error parsing words: ' + e);
                }
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted() {
            i18nService.initDomI18n();
            this.originalPredictionary = Predictionary.instance();
            this.originalPredictionary.loadDictionary(this.dictData.data, this.dictData.dictionaryKey);
            helpService.setHelpLocation('07_dictionaries', '#add-words');
        },
        updated() {
            i18nService.initDomI18n();
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }

    .btn-accordion {
        background-color: white;
        border-style: solid;
        border-color: gray;
        border-width: 1px;
        text-align: left;
        border-left: none;
        border-right: none;
    }
    .btn-accordion:hover span {
        color: cornflowerblue;
    }
</style>
<template>
    <div>
        <accordion :acc-label="$t('addWordForm')" acc-label-type="h2" acc-open="true" acc-background-color="white">
            <edit-word-form v-model="newWordForm" :allow-empty="true"></edit-word-form>
            <div class="srow mb-4">
                <button class="three columns offset-by-nine" @click="addWordForm()" :disabled="!newWordForm.value">{{ $t('addWordForm') }}</button>
            </div>
        </accordion>
        <accordion :acc-label="$t('importExport')" acc-label-type="h2" acc-background-color="white">
            <div class="srow">
                <input id="importExportGlobally" type="checkbox" v-model="importExportGlobally" @change="overrideAtImport = importExportGlobally ? true : overrideAtImport"/>
                <label for="importExportGlobally">{{ $t('importexportDataTofromAllGrids') }}</label>
            </div>
            <div class="srow">
                <input id="overrideAtImport" type="checkbox" :disabled="importExportGlobally" v-model="overrideAtImport"/>
                <label for="overrideAtImport">{{ $t('overrideExistingWordForms') }}</label>
            </div>
            <div class="srow">
                <button class="three columns six columns" @click="importFromClipboard()"><i class="fas fa-file-import"/> {{ $t('importFromClipboard') }}</button>
                <button class="three columns six columns" @click="copyToClipboard()"><i class="fas fa-file-export"/> {{ $t('copyToClipboard') }}</button>
            </div>
            <div class="srow" v-if="currentMsg === msgTypes.WAIT">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="srow warn" v-if="currentMsg === msgTypes.ERROR_PASTE">
                <i class="fas fa-exclamation-triangle"></i>
                <span>{{ $t('clipboardContainsNoWordFormsPleaseCopyFrom') }}</span>
            </div>
            <div class="srow success" v-if="currentMsg === msgTypes.SUCCESS_PASTE">
                <i class="fas fa-check"></i>
                <span v-if="gridPasteCount === 0">{{ $t('importedWordForms', {count: msgCount}) }}</span>
                <span v-if="gridPasteCount > 0">{{ $t('importedWordFormsGrids', {count: msgCount, gridCount: this.gridPasteCount}) }}</span>
            </div>
            <div class="srow success" v-if="currentMsg === msgTypes.SUCCESS_COPY">
                <i class="fas fa-check"></i>
                <span>{{ $t('copiedWordForms', {count: msgCount}) }}</span>
            </div>
        </accordion>

        <div class="mb-3 mt-5 d-flex align-items-end">
            <h2 class="me-3">{{ $t('currentWordForms') }}</h2>
            <span v-if="gridElement.wordForms.length > 0">{{ gridElement.wordForms.length }} {{ 'elementsBracket' | translate}}</span>
        </div>
        <div class="row mb-3">
            <label for="filterLang" class="col-12 col-md-3">{{ $t('language') }}</label>
            <div class="col-12 col-md-3 mb-2">
                <select class="col-12" id="filterLang" v-model="filterLang">
                    <option :value="null">{{ $t('allSelected') }}</option>
                    <option v-if="gridElement.wordForms.some((f) => f.lang === lang.code)" v-for="lang in langs" :value="lang.code">{{lang | extractTranslationAppLang}} ({{ lang.code }})</option>
                </select>
            </div>
            <div class="col-12 col-md-3"/>
            <div class="col-12 col-md-3 d-flex justify-content-end">
                <button @click="deleteAll" class="flex-grow-1"><i class="fas fa-trash"/> {{ $t('deleteAll') }}</button>
            </div>
        </div>
        <ol v-if="gridElement.wordForms.length > 0" style="list-style-type: none">
            <li v-if="!filterLang || form.lang === filterLang" v-for="(form, index) in gridElement.wordForms" :class="index % 2 === 1 && index !== editId ? 'bg-gray' : ''">
                <div class="row">
                    <div class="col-12 col-sm-8 my-2 my-sm-0 d-flex">
                        <div class="row d-flex align-items-center flex-grow-1">
                            <span v-if="form.lang" class="col-2 col-md-1">
                                <span class="lang-tag p-2 m-1">{{ form.lang }}</span>
                            </span>
                            <span class="col-3 col-md-3 value"><strong>{{ form.value }}</strong></span>
                            <div v-if="form.tags.length" class="col-7 col-md-8">
                                <div class="row">
                                    <span v-for="tag in form.tags" class="tag">{{ tag }}</span>
                                </div>
                            </div>
                            <span v-if="!form.tags.length" class="col-7 col-md-8">(no tags)</span>
                        </div>
                    </div>
                    <div class="col-12 col-sm-4 mb-2 mb-sm-0 d-flex">
                        <button class="col" :title="editId !== index ? 'Edit' : 'End editing'" @click="edit(index)"><i class="fas fa-pencil-alt"/></button>
                        <button class="col" :title="$t('delete')" @click="remove(form)"><i class="fas fa-trash"/></button>
                        <button class="col" :title="$t('moveUp')" @click="moveUp(form)"><i class="fas fa-arrow-up"/></button>
                        <button class="col" :title="$t('moveDown')" @click="moveDown(form)"><i class="fas fa-arrow-down"/></button>
                    </div>
                </div>
                <edit-word-form v-if="editId === index" class="my-3 ps-4 pe-4" v-model="gridElement.wordForms[index]"></edit-word-form>
            </li>
        </ol>
        <span v-if="gridElement.wordForms.length === 0">{{ $t('noWordFormsDefined') }}</span>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {helpService} from "../../js/service/helpService";
    import {WordForm} from "../../js/model/WordForm.js";
    import EditWordForm from "../components/editWordForm.vue";
    import Accordion from "../components/accordion.vue";
    import {util} from "../../js/util/util.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {dataService} from "../../js/service/data/dataService.js";
    import {constants} from "../../js/util/constants.js";

    export default {
        components: {Accordion, EditWordForm},
        props: ['gridElement', 'gridData'],
        data: function () {
            return {
                newWordForm: JSON.parse(JSON.stringify(new WordForm())),
                editId: undefined,
                importExportGlobally: false,
                overrideAtImport: false,
                allGrids: null,
                langs: i18nService.getAllLanguages(),
                filterLang: null,
                msgTypes: {
                    WAIT: 'WAIT',
                    SUCCESS_COPY: 'SUCCESS_COPY',
                    SUCCESS_PASTE: 'SUCCESS_PASTE',
                    ERROR_PASTE: 'ERROR_PASTE',
                },
                currentMsg: null,
                msgCount: 0,
                gridPasteCount: 0
            }
        },
        methods: {
            addWordForm() {
                this.gridElement.wordForms.push(this.newWordForm);
                this.newWordForm = JSON.parse(JSON.stringify(new WordForm()));
            },
            deleteAll() {
                if (!confirm(i18nService.t("doYouReallyWantDeleteAllWordForms"))) {
                    return;
                }
                this.gridElement.wordForms = [];
            },
            remove(toRemove) {
                this.gridElement.wordForms = this.gridElement.wordForms.filter(f => f !== toRemove);
            },
            edit(id) {
                this.editId = this.editId === id ? undefined : id;
            },
            moveUp(toMove) {
                let index = this.gridElement.wordForms.indexOf(toMove);
                if (index > 0) {
                    this.exchange(index - 1, index);
                }
            },
            moveDown(toMove) {
                let index = this.gridElement.wordForms.indexOf(toMove);
                if (index < this.gridElement.wordForms.length - 1) {
                    this.exchange(index + 1, index);
                }
            },
            exchange(i1, i2) {
                let temp = this.gridElement.wordForms[i1];
                this.gridElement.wordForms[i1] = this.gridElement.wordForms[i2];
                this.gridElement.wordForms[i2] = temp;
                this.$forceUpdate();
            },
            async importFromClipboard() {
                this.currentMsg = null;
                this.msgCount = this.gridPasteCount = 0;
                let result = await util.getClipboardContent();
                let rows = result.split('\n').filter(row => !!row);
                let colNrValue = 0;
                let colNrLang = 1;
                let colNrTags = 2;
                let colNrBase = 3;
                let colNrPronunciation = 4;
                rows = rows.map(row => row.split('\t'));
                rows = rows.map(row => {
                    row[colNrTags] = row[colNrTags] ? row[colNrTags].split(",").map(tag => tag.trim().toLocaleUpperCase()).filter(tag => !!tag) : null;
                    return row;
                });
                rows = rows.filter(row => (!row[colNrLang] || row[colNrLang].length === 2) && row[colNrValue]);
                if (!rows.length) {
                    this.currentMsg = this.msgTypes.ERROR_PASTE;
                    return;
                }
                if (this.overrideAtImport && this.gridElement.wordForms.length > 0) {
                    if (!confirm(i18nService.t("doYouReallyWantDeleteExistingWordForms"))) {
                        return;
                    }
                }
                let importForms = rows.map(row => {
                    return {
                        lang: row[colNrLang] ? row[colNrLang].toLocaleLowerCase() : undefined,
                        tags: row[colNrTags] ? row[colNrTags] : [],
                        value: row[colNrValue],
                        pronunciation: row[colNrPronunciation],
                        base: this.importExportGlobally ? row[colNrBase] : undefined
                    }
                })
                if (!this.importExportGlobally) {
                    this.gridElement.wordForms = this.overrideAtImport ? [] : this.gridElement.wordForms;
                    this.gridElement.wordForms = this.gridElement.wordForms.concat(importForms);
                } else {
                    this.allGrids = this.allGrids || (await dataService.getGrids(true));
                    let baseMap = {}; // base -> list of word form objects
                    for (let newForm of importForms) {
                        let baseString = newForm.base || "";
                        let bases = baseString.split(";");
                        for (let base of bases) {
                            baseMap[base] = baseMap[base] || [];
                            baseMap[base].push(newForm);
                        }
                    }
                    let ownGridChanged = false;
                    for (let grid of this.allGrids) {
                        let changedGrid = false;
                        for (let element of grid.gridElements) {
                            let allNewWordForms = new Set();
                            let baseStrings = this.getBaseStringsFromWordForms(element.wordForms);
                            for (let baseString of baseStrings) {
                                if (baseMap[baseString]) {
                                    allNewWordForms = new Set([...allNewWordForms, ...baseMap[baseString]]);
                                }
                            }
                            let newArray = Array.from(allNewWordForms);
                            changedGrid = changedGrid || element.wordForms.length !== newArray.length || JSON.stringify(element.wordForms) !== JSON.stringify(newArray);
                            element.wordForms = newArray;
                        }
                        if (changedGrid) {
                            this.gridPasteCount++;
                            await dataService.saveGrid(grid);
                            if (grid.id === this.gridData.id) {
                                ownGridChanged = true;
                            }
                        }
                    }
                    if (ownGridChanged) {
                        this.$emit('reloadData');
                    }
                }
                this.msgCount = rows.length;
                this.currentMsg = this.msgTypes.SUCCESS_PASTE;
            },
            async copyToClipboard() {
                this.currentMsg = null;
                this.msgCount = 0;
                let elements = [];
                if (this.importExportGlobally) {
                    this.allGrids = this.allGrids || (await dataService.getGrids(true));
                    for (let grid of this.allGrids) {
                        elements = elements.concat(grid.gridElements);
                    }
                } else {
                    elements = [this.gridElement];
                }
                let copyString = '';
                let alreadyCopied = {}; // base -> tags
                for (let element of elements) {
                    let forms = element.wordForms || [];
                    let baseStrings = this.getBaseStringsFromWordForms(forms);
                    let baseFormsString = baseStrings.join(";");
                    for (let form of forms) {
                        let tags = JSON.stringify(form.tags).replaceAll('"', '').replaceAll("'", "").replaceAll("[", "").replaceAll("]", "").replaceAll(",", ", ");
                        let lang = form.lang || '';
                        let pronunciation = form.pronunciation || '';
                        let key = baseFormsString + tags + lang;
                        alreadyCopied[key] = alreadyCopied[key] || [];
                        if (!this.importExportGlobally || (baseFormsString && !alreadyCopied[key].includes(tags))) {
                            alreadyCopied[key].push(tags);
                            copyString += `${form.value}\t${lang}\t${tags}\t${baseFormsString}\t${pronunciation}\n`;
                            this.msgCount++;
                        }
                    }
                }
                util.copyToClipboard(copyString);
                this.currentMsg = this.msgTypes.SUCCESS_COPY;
            },
            /**
             * returns a list of base form strings in form of "<baseForm>:<lang>" from a given list of word forms.
             * @param wordForms
             * @return list of base form strings, e.g. ["sein:de", "be:en", "ser:es", ...]
             */
            getBaseStringsFromWordForms (forms) {
                forms = forms || [];
                let baseForms = forms.filter(form => form.tags.includes(constants.WORDFORM_TAG_BASE));
                return baseForms.map(form => `${form.value}:${form.lang}`);
            }
        },
        mounted() {
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
li {
    border: 1px solid gray;
    margin-bottom: 0;
}

li > .row {
    margin: 0;
}

button {
    margin-bottom: 0;
    flex-grow: 1;
    flex-shrink: 1;
    padding: 0;
}

.bg-gray {
    background-color: lightgray;
}

.tag {
    background-color: #41b883;
    flex-basis: min-content;
    flex-shrink: 1;
    margin: 0.3em 0.3em 0.3em 0;
    border-radius: 5px;
}

.value {
    min-width: 4em;
}

.lang-tag {
    background-color: lightblue;
    border-radius: 5px;
}

@media (max-width: 575px) {
    li {
        margin-bottom: 0.8em;
    }
}
</style>
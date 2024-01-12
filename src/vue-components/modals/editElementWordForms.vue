<template>
    <div>
        <accordion :acc-label="$t('addWordForm')" acc-label-type="h2" acc-open="true" acc-background-color="white">
            <edit-word-form v-model="newWordForm"></edit-word-form>
            <div class="srow mb-4">
                <button class="three columns offset-by-nine" @click="addWordForm()" :disabled="!newWordForm.value">{{ $t('addWordForm') }}</button>
            </div>
        </accordion>
        <accordion :acc-label="$t('importExport')" acc-label-type="h2" acc-background-color="white">
            <div class="srow">
                <input id="overrideAtImport" type="checkbox" v-model="overrideAtImport"/>
                <label for="overrideAtImport">{{ $t('overrideExistingWordForms') }}</label>
            </div>
            <div class="srow">
                <button class="three columns six columns" @click="importFromClipboard()">{{ $t('importFromClipboard') }}</button>
                <button class="three columns six columns" @click="copyToClipboard()">{{ $t('copyToClipboard') }}</button>
            </div>
            <div class="srow warn" v-if="showError">
                <i class="fas fa-exclamation-triangle"></i>
                <span>{{ $t('clipboardContainsNoWordFormsPleaseCopyFrom') }}</span>
            </div>
            <div class="srow success" v-if="successImportedCount">
                <i class="fas fa-check"></i>
                <span>Successfully imported {{successImportedCount}} word forms.</span>
            </div>
        </accordion>

        <h2 class="mb-3 mt-5">{{ $t('currentWordForms') }}</h2>
        <ol v-if="gridElement.wordForms.length > 0" style="list-style-type: none">
            <li v-for="(form, index) in gridElement.wordForms" :class="index % 2 === 1 && index !== editId ? 'bg-gray' : ''">
                <div class="row d-flex">
                    <div class="col-12 col-sm-8 d-flex align-items-center my-2 my-sm-0">
                        <div class="row col-12">
                            <span v-if="form.lang" class="col-2 lang-tag">{{ form.lang }}</span>
                            <span class="col-2 me-2 value"><strong>{{ form.value }}</strong></span>
                            <span v-if="form.tags.length" class="col-8 me-2">
                                <span v-for="tag in form.tags" class="tag p-2 m-1">{{ tag }}</span>
                            </span>
                            <span v-if="!form.tags.length" class="col-8 me-2">(no tags)</span>
                        </div>
                    </div>
                    <div class="col-12 col-sm-4 d-flex mb-2 mb-sm-0">
                        <button :title="editId !== index ? 'Edit' : 'End editing'" @click="edit(index)"><i class="fas fa-pencil-alt"/></button>
                        <button :title="$t('delete')" @click="remove(form)"><i class="fas fa-trash"/></button>
                        <button :title="$t('moveUp')" @click="moveUp(form)"><i class="fas fa-arrow-up"/></button>
                        <button :title="$t('moveDown')" @click="moveDown(form)"><i class="fas fa-arrow-down"/></button>
                    </div>
                </div>
                <edit-word-form v-if="editId === index" class="my-3 ps-2 pe-4" v-model="gridElement.wordForms[index]"></edit-word-form>
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
    import {constants} from "../../js/util/constants.js";
    import {i18nService} from "../../js/service/i18nService.js";

    export default {
        components: {Accordion, EditWordForm},
        props: ['gridElement', 'gridData'],
        data: function () {
            return {
                newWordForm: JSON.parse(JSON.stringify(new WordForm())),
                editId: undefined,
                overrideAtImport: false,
                showError: false,
                successImportedCount: 0
            }
        },
        methods: {
            addWordForm() {
                this.gridElement.wordForms.push(this.newWordForm);
                this.newWordForm = JSON.parse(JSON.stringify(new WordForm()));
            },
            remove(toRemove) {
                this.gridElement.wordForms = this.gridElement.wordForms.filter(f => f !== toRemove);
            },
            edit(id) {
                this.editId = this.editId === undefined ? id : undefined;
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
            importFromClipboard() {
                this.showError = this.successImportedCount = false;
                util.getClipboardContent().then(result => {
                    let rows = result.split('\n').map(row => row.trim()).filter(row => !!row);
                    rows = rows.map(row => row.split('\t'));
                    rows = rows.map(row => {
                        row[2] = row[2] ? row[2].split(",").map(tag => tag.trim().toLocaleUpperCase()).filter(tag => !!tag) : null;
                        return row;
                    });
                    rows = rows.filter(row => (!row[0] || row[0].length === 2) && row[3])
                    if (!rows.length) {
                        this.showError = true;
                        return;
                    }
                    if(this.overrideAtImport && this.gridElement.wordForms.length > 0) {
                        if(!confirm(i18nService.t("doYouReallyWantDeleteExistingWordForms"))) {
                            return;
                        }
                    }
                    this.gridElement.wordForms = this.overrideAtImport ? [] : this.gridElement.wordForms;
                    for (let row of rows) {
                        this.gridElement.wordForms.push({
                            lang: row[0] ? row[0].toLocaleLowerCase() : undefined,
                            tags: row[2] ? row[2] : [],
                            value: row[3]
                        })
                    }
                    this.successImportedCount = rows.length;
                })

            },
            copyToClipboard() {
                this.showError = this.successImportedCount = false;
                let copyString = '';
                let baseForm = this.gridElement.wordForms.filter(form => form.tags.length === 1 && form.tags[0] === constants.WORDFORM_TAG_BASE)[0] || {};
                for (let form of this.gridElement.wordForms) {
                    let tags = JSON.stringify(form.tags).replaceAll('"', '').replaceAll("'", "").replaceAll("[", "").replaceAll("]", "").replaceAll(",", ", ");
                    let lang = form.lang || '';
                    let base = baseForm.value || i18nService.getTranslation(this.gridElement.label, {forceLang: lang}) || i18nService.getTranslation(this.gridElement.label);
                    copyString += `${lang}\t${base}\t${tags}\t${form.value}\n`;
                }
                util.copyToClipboard(copyString);
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
}

.value {
    min-width: 4em;
}

.lang-tag {
    background-color: #266697;
}

@media (max-width: 575px) {
    li {
        margin-bottom: 0.8em;
    }
}
</style>
<template>
    <div>
        <accordion :acc-label="$t('Add word form')" acc-label-type="h2" acc-open="true" acc-background-color="white">
            <edit-word-form v-model="newWordForm"></edit-word-form>
            <div class="srow mb-4">
                <button class="three columns offset-by-nine" @click="addWordForm()" :disabled="!newWordForm.value">Add word form</button>
            </div>
        </accordion>
        <accordion :acc-label="$t('Import / Export')" acc-label-type="h2" acc-background-color="white">
            <span>Import / Export from spreadsheet to come</span>
        </accordion>

        <h2 class="mb-3 mt-5">Current word forms</h2>
        <ol v-if="gridElement.wordForms.length > 0" style="list-style-type: none">
            <li v-for="(form, index) in gridElement.wordForms" :class="index % 2 === 1 && index !== editId ? 'bg-gray' : ''">
                <div class="srow ps-2">
                    <div class="eight columns">
                        <span class="me-2"><strong>{{ form.value }}</strong></span>
                        <span v-if="form.tags.length" class="me-2">{{ form.tags }}</span>
                        <span v-if="!form.tags.length" class="me-2">(no tags)</span>
                        <span v-if="form.lang" class="me-2">{{ form.lang }}</span>
                        <span v-if="!form.lang" class="me-2">(no language)</span>
                    </div>
                    <div class="four columns d-flex">
                        <button :title="editId !== index ? 'Edit' : 'End editing'" @click="edit(index)"><i class="fas fa-pencil-alt"/></button>
                        <button title="Delete" @click="remove(form)"><i class="fas fa-trash"/></button>
                        <button title="Move up" @click="moveUp(form)"><i class="fas fa-arrow-up"/></button>
                        <button title="Move down" @click="moveDown(form)"><i class="fas fa-arrow-down"/></button>
                    </div>
                </div>
                <edit-word-form v-if="editId === index" class="my-3 ps-2 pe-4" v-model="gridElement.wordForms[index]"></edit-word-form>
            </li>
        </ol>
        <span v-if="gridElement.wordForms.length === 0">(no word forms defined)</span>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {helpService} from "../../js/service/helpService";
    import {WordForm} from "../../js/model/WordForm.js";
    import EditWordForm from "../components/editWordForm.vue";
    import Accordion from "../components/accordion.vue";
    import {util} from "../../js/util/util.js";

    export default {
        components: {Accordion, EditWordForm},
        props: ['gridElement', 'gridData'],
        data: function () {
            return {
                newWordForm: JSON.parse(JSON.stringify(new WordForm())),
                editId: undefined
            }
        },
        methods: {
            addWordForm() {
                this.gridElement.wordForms.push(this.newWordForm);
                this.newWordForm = JSON.parse(JSON.stringify(new WordForm()));
                /*util.getClipboardContent().then(result => {
                    log.warn(result);
                    for(let c of result) {
                        console.log(c, c.charCodeAt(0));
                    }
                    let rows = result.split('\n').map(row => row.trim());
                    rows = rows.map(row => row.split('\t'));
                    log.warn(rows);
                })*/
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

li > .srow {
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

@media (max-width: 850px) {
    li {
        margin-bottom: 0.8em;
    }
}
</style>
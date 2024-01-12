<template>
    <div>
        <div class="srow">
            <label class="three columns">Language</label>
            <select class="nine columns" v-model="wordForm.lang">
                <option :value="undefined">(none)</option>
                <option v-for="lang in langs" :value="lang.code">{{ lang.code }}</option>
            </select>
        </div>
        <div class="srow">
            <label class="three columns">Tags</label>
            <multiselect class="nine columns" v-model="wordForm.tags" :options="TAGS" :multiple="true" :close-on-select="false" :clear-on-select="false" :taggable="true" @tag="addTag(wordForm, $event)" placeholder="Choose tags">
            </multiselect>
        </div>
        <div class="srow">
            <label class="three columns">Value</label>
            <input class="nine columns" type="text" v-model="wordForm.value"/>
        </div>
    </div>
</template>

<script>
    import Multiselect from 'vue-multiselect';
    import {i18nService} from "../../js/service/i18nService.js";
    import {constants} from "../../js/util/constants.js";

    export default {
        props: ["value"],
        components: { Multiselect },
        data() {
            return {
                wordForm: this.value,
                langs: i18nService.getAllLanguages(),
                TAGS: JSON.parse(JSON.stringify(constants.WORDFORM_TAGS))
            }
        },
        watch: {
            value: function (newVal, oldVal) {
                this.wordForm = newVal;
            },
            wordForm: function (newVal, oldVal) {
                this.$emit('input', newVal);
            }
        },
        methods: {
            addTag(wordForm, newTag) {
                this.TAGS.push(newTag);
                wordForm.tags.push(newTag);
            }
        },
        mounted() {
        },
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
</style>
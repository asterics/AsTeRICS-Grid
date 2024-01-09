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
            <multiselect class="nine columns" v-model="wordForm.tags" :options="TAGS" :multiple="true" :close-on-select="false" :clear-on-select="false" placeholder="Choose tags">
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

    export default {
        props: ["value"],
        components: { Multiselect },
        data() {
            return {
                wordForm: this.value,
                langs: i18nService.getAllLanguages(),
                TAGS: ["BASE",
                    "NEGATION",
                    "SINGULAR", "PLURAL",
                    "1.PERS", "2.PERS", "3.PERS",
                    "1.CASE", "2.CASE", "3.CASE", "4.CASE", "5.CASE", "6.CASE",
                    "FEMININE", "MASCULINE", "NEUTRAL",
                    "COMPARATIVE", "SUPERLATIVE",
                    "PRESENT", "PAST", "FUTURE",
                    "INDEFINITE", "DEFINITE"]
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
        },
        mounted() {
        },
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
</style>
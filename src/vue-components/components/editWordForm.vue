<template>
    <div>
        <div class="srow">
            <label for="selectLang" class="three columns">{{ $t('language') }}</label>
            <select id="selectLang" class="nine columns" v-model="wordForm.lang">
                <option :value="undefined">{{ $t('noneSelected') }}</option>
                <option v-for="lang in langs" :value="lang.code">{{lang | extractTranslationAppLang}} ({{ lang.code }})</option>
            </select>
        </div>
        <div class="srow">
            <label for="selectTags" class="three columns">{{ $t('tags') }}</label>
            <multiselect id="selectTags" class="nine columns" v-model="wordForm.tags" :options="TAGS" :multiple="true" :close-on-select="false" :clear-on-select="false" :taggable="true" @tag="addTag(wordForm, $event)" :placeholder="$t('chooseTagsOrAddNew')">
            </multiselect>
        </div>
        <div class="srow">
            <label for="wordValue" class="three columns">{{ $t('wordFormValue') }}</label>
            <input id="wordValue" class="three columns" type="text" v-model="wordForm.value" @change="lastValidValue = wordForm.value || lastValidValue" @focusout="lostFocus"/>
            <label for="pronunciation" class="two columns">{{ $t('pronunciation') }}</label>
            <div class="four columns">
                <div class="d-flex">
                    <input id="pronunciation" :placeholder="$t('optionalBracket')" type="text" v-model="wordForm.pronunciation" class="flex-grow-1 align-self-baseline"/>
                    <button :disabled="!wordForm.pronunciation && !wordForm.value" @click="speechService.speak(wordForm.pronunciation || wordForm.value)" class="px-1 py-0" style="line-height: inherit;"><i class="fas fa-play"/></button>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
    import Multiselect from 'vue-multiselect';
    import {i18nService} from "../../js/service/i18nService.js";
    import {constants} from "../../js/util/constants.js";
    import {speechService} from "../../js/service/speechService.js";

    export default {
        props: ["value", "allowEmpty"],
        components: { Multiselect },
        data() {
            return {
                wordForm: this.value,
                langs: i18nService.getAllLanguages(),
                TAGS: JSON.parse(JSON.stringify(constants.WORDFORM_TAGS)),
                speechService: speechService,
                lastValidValue: this.value.value
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
            },
            lostFocus() {
                if (!this.allowEmpty) {
                    this.wordForm.value = this.wordForm.value || this.lastValidValue;
                }
            }
        },
        mounted() {
        },
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
</style>
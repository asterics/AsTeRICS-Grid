<template>
    <div>
        <div class="srow">
            <label for="selectMode" class="four columns">{{ $t('actionType') }}</label>
            <select id="selectMode" class="eight columns" v-model="action.type">
                <option v-for="mode in GridActionWordForm.MODES" :value="mode">{{ mode | translate }}</option>
            </select>
        </div>
        <div class="srow" v-if="action.type === GridActionWordForm.WORDFORM_MODE_NEXT_FORM">
            <label for="selectMode2" class="four columns">{{ $t('secondaryActionType') }}</label>
            <select id="selectMode2" class="eight columns" v-model="action.secondaryType">
                <option :value="undefined">{{ $t('noneSelected') }}</option>
                <option v-for="mode in GridActionWordForm.MODES_SECONDARY" :value="mode">{{ mode | translate }}</option>
            </select>
        </div>
        <div v-if="![GridActionWordForm.WORDFORM_MODE_NEXT_FORM, GridActionWordForm.WORDFORM_MODE_RESET_FORMS].includes(action.type)">
            <div class="srow">
                <label class="four columns">{{ $t('tags') }}</label>
                <multiselect class="eight columns" v-model="action.tags" :options="TAGS" :multiple="true" :close-on-select="false" :clear-on-select="false" :taggable="true" @tag="addTag($event)" placeholder="Choose tags">
                </multiselect>
            </div>
            <div class="srow mt-4">
                <input type="checkbox" id="chkToggle" v-model="action.toggle"/>
                <label for="chkToggle">{{ $t('toggleTagOnSelectingItMultipleTimes') }}</label>
            </div>
        </div>
    </div>
</template>

<script>
import './../../../css/modal.css';
import Multiselect from 'vue-multiselect';
import {constants} from "../../../js/util/constants.js";
import {GridActionWordForm} from "../../../js/model/GridActionWordForm.js";


export default {
    props: ['action', 'gridData'],
    components: { Multiselect },
    data: function () {
        return {
            TAGS: JSON.parse(JSON.stringify(constants.WORDFORM_TAGS)),
            GridActionWordForm: GridActionWordForm
        }
    },
    methods: {
        addTag(newTag) {
            this.TAGS.push(newTag);
            this.action.tags.push(newTag);
        }
    },
    mounted () {
    },
    beforeDestroy() {
    }
}
</script>

<style scoped>
</style>
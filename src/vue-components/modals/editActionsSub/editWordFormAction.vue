<template>
    <div>
        <div class="srow">
            <label class="three columns">{{ $t('actionType') }}</label>
            <select class="nine columns" v-model="action.type">
                <option v-for="mode in GridActionWordForm.MODES" :value="mode">{{ mode | translate }}</option>
            </select>
        </div>
        <div class="srow" v-if="action.type !== GridActionWordForm.WORDFORM_MODE_NEXT_FORM">
            <label class="three columns">{{ $t('tags') }}</label>
            <multiselect class="nine columns" v-model="action.tags" :options="TAGS" :multiple="true" :close-on-select="false" :clear-on-select="false" :taggable="true" @tag="addTag($event)" placeholder="Choose tags">
            </multiselect>
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
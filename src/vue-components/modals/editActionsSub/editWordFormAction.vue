<template>
    <div>
        <div class="srow">
            <label class="three columns">Tags</label>
            <multiselect class="nine columns" v-model="action.tags" :options="TAGS" :multiple="true" :close-on-select="false" :clear-on-select="false" :taggable="true" @tag="addTag($event)" placeholder="Choose tags">
            </multiselect>
        </div>
    </div>
</template>

<script>
import './../../../css/modal.css';
import Multiselect from 'vue-multiselect';
import {constants} from "../../../js/util/constants.js";


export default {
    props: ['action', 'gridData'],
    components: { Multiselect },
    data: function () {
        return {
            TAGS: JSON.parse(JSON.stringify(constants.WORDFORM_TAGS))
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
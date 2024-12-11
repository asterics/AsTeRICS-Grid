<template>
    <grid-layout class="grid-display" v-if="gridData"
                 :elements="gridData.gridElements" :render-component="AppGridElement" :metadata="metadata"
                 :rows="gridData.rowCount" :columns="gridData.minColumnCount" :background-color="metadata.colorConfig.gridBackgroundColor" component-type="ol">
    </grid-layout>
</template>

<script>

import GridLayout from '../grid-layout/grid-layout.vue';
import GridElement from '../grid-layout/grid-element.vue';
import AppGridElement from './appGridElement.vue';

export default {
    components: { GridElement, GridLayout, AppGridElement },
    props: ["gridData", "metadata"],
    data() {
        return {
            AppGridElement: AppGridElement
        }
    },
    computed: {
    },
    methods: {
    },
    mounted() {
    },
}
</script>

<style scoped>
.grid-display {
    -webkit-user-select: none; /* Safari */
    -ms-user-select: none; /* IE 10 and IE 11 */
    user-select: none; /* Standard syntax */
    -webkit-touch-callout: none;
}
</style>
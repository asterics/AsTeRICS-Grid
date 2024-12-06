<template>
    <grid-layout class="grid-display" v-if="gridData" :rows="gridData.rowCount" :columns="gridData.minColumnCount" :background-color="metadata.colorConfig.gridBackgroundColor" component-type="ol">
        <grid-element v-for="elem in gridData.gridElements" :key="elem.id" :x="elem.x" :y="elem.y" :width="elem.width" :height="elem.height" component-type="li">
            <app-grid-element v-if="!elem.hidden" :grid-element="elem" :metadata="metadata"/>
        </grid-element>
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
}
</style>
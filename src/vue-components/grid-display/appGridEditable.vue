<template>
    <grid-layout v-if="gridData" :rows="gridData.rowCount" :columns="columns" :options="{backgroundColor: metadata.colorConfig.gridBackgroundColor, componentType: 'ol'}">
        <grid-element v-for="elem in gridData.gridElements" :key="elem.id" :x="elem.x" :y="elem.y" :width="elem.width" :height="elem.height" component-type="li">
            <app-grid-element :grid-element="elem" :metadata="metadata"/>
        </grid-element>
    </grid-layout>
</template>

<script>

import GridLayout from '../grid-layout/grid-layout.vue';
import GridElement from '../grid-layout/grid-element.vue';
import AppGridElement from './appGridElement.vue';
import { gridUtil } from '../../js/util/gridUtil';

export default {
    components: { GridElement, GridLayout, AppGridElement },
    props: ["gridData", "metadata"],
    data() {
        return {
        }
    },
    computed: {
        columns() {
            return gridUtil.getWidthWithBounds(this.gridData);
        }
    },
    methods: {
    },
    mounted() {
    },
}
</script>

<style scoped>
</style>
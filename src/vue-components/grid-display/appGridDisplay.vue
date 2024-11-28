<template>
    <grid-layout class="grid-layout-container" v-if="renderGrid" :rows="renderGrid.rowCount" :columns="columns" :options="{backgroundColor: metadata.colorConfig.gridBackgroundColor, componentType: 'ol'}">
        <grid-element v-for="elem in renderGrid.gridElements" :key="elem.id" :x="elem.x" :y="elem.y" :width="elem.width" :height="elem.height" component-type="li">
            <app-grid-element :grid-element="elem" :metadata="metadata"/>
        </grid-element>
    </grid-layout>
</template>

<script>

import GridLayout from '../grid-layout/grid-layout.vue';
import { gridUtil } from '../../js/util/gridUtil';
import GridElement from '../grid-layout/grid-element.vue';
import AppGridElement from './appGridElement.vue';

export default {
    components: { GridElement, GridLayout, AppGridElement },
    props: ["gridData", "metadata"],
    data() {
        return {
            renderGrid: null,
            columns: null
        }
    },
    watch: {
        gridData: function() {
            this.load();
        }
    },
    computed: {
    },
    methods: {
        load() {
            this.columns = gridUtil.getWidthWithBounds(this.gridData);
            this.renderGrid = this.gridData;
        }
    },
    mounted() {
        this.load();
    },
}
</script>

<style scoped>
</style>
<template>
    <grid-layout v-if="renderGrid" :rows="renderGrid.rowCount" :columns="columns">
        <grid-element-normal v-for="elem in renderGrid.gridElements" :grid-element="elem" :metadata="metadata" :key="elem.id"
                             :style="`margin: 2px; border: 1px solid black; border-radius: 3px; grid-column-start:${elem.x + 1}; grid-column-end:${elem.x + 1 + elem.width}; grid-row-start:${elem.y + 1}; grid-row-end:${elem.y + 1 + elem.height};`">{{elem.label.en}}
        </grid-element-normal>
    </grid-layout>
</template>

<script>

import GridLayout from './grid-layout.vue';
import GridElementNormal from './gridElementNormal.vue';
import { GridData } from '../../js/model/GridData';
import { gridUtil } from '../../js/util/gridUtil';

export default {
    components: { GridElementNormal, GridLayout },
    props: ["gridData", "globalGridData", "metadata"],
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
    methods: {
        async load() {
            let renderGrid = gridUtil.mergeGrids(this.gridData, this.globalGridData);
            this.columns = new GridData(renderGrid).getWidthWithBounds();
            this.renderGrid = renderGrid;
        }
    },
    mounted() {
        this.load();
    },
}
</script>

<style scoped>
</style>
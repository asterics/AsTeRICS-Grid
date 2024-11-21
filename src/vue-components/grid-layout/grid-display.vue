<template>
    <grid-layout v-if="renderGrid" :rows="renderGrid.rowCount" :columns="columns" :options="{backgroundColor: metadata.colorConfig.gridBackgroundColor}">
        <grid-element-normal v-for="elem in renderGrid.gridElements" :grid-element="elem" :metadata="metadata" :key="elem.id"
                             :style="`margin: 2px; border-radius: 3px; grid-column-start:${elem.x + 1}; grid-column-end:${elem.x + 1 + elem.width}; grid-row-start:${elem.y + 1}; grid-row-end:${elem.y + 1 + elem.height};`">{{elem.label.en}}
        </grid-element-normal>
    </grid-layout>
</template>

<script>

import GridLayout from './grid-layout.vue';
import GridElementNormal from './gridElementNormal.vue';
import { gridUtil } from '../../js/util/gridUtil';

export default {
    components: { GridElementNormal, GridLayout },
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
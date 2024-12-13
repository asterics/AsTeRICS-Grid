<template>
    <grid-layout v-if="gridData" v-on="$listeners"
                 :elements="gridData.gridElements"
                 :render-component="AppGridElement" :metadata="metadata" :show-resize-handle="true"
                 :editable="true" :rows="gridData.rowCount" :columns="gridData.minColumnCount"
                 :background-color="metadata.colorConfig.gridBackgroundColor" :background-lines="true"
                 component-type="ol" :watch-data="watchData">
    </grid-layout>
</template>

<script>

import GridLayout from '../grid-layout/grid-layout.vue';
import GridElement from '../grid-layout/grid-element.vue';
import AppGridElement from './appGridElement.vue';
import { gridLayoutUtil } from '../../js/util/gridLayoutUtil';

export default {
    components: { GridElement, GridLayout, AppGridElement },
    props: ["gridData", "metadata", "watchData"],
    data() {
        return {
            AppGridElement: AppGridElement
        }
    }
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
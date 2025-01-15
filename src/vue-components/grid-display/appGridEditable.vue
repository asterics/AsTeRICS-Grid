<template>
    <grid-layout v-if="gridData && metadata" :key="gridData.id" v-on="$listeners"
                 :elements="gridData.gridElements"
                 :render-component="AppGridElement" :metadata="metadata" :show-resize-handle="true"
                 :editable="true" :rows="gridData.rowCount" :columns="gridData.minColumnCount"
                 :background-color="metadata.colorConfig.gridBackgroundColor" :background-lines="true">
    </grid-layout>
</template>

<script>

import GridLayout from '../grid-layout/components/grid-layout.vue';
import GridElement from '../grid-layout/components/grid-element.vue';
import AppGridElement from './appGridElement.vue';

export default {
    components: { GridElement, GridLayout, AppGridElement },
    props: ["gridData", "metadata"],
    data() {
        return {
            AppGridElement: AppGridElement
        }
    }
}
</script>

<style scoped>
</style>
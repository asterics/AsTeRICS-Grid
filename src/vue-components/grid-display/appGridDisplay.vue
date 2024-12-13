<template>
    <grid-layout v-if="gridData"
                 :elements="gridData.gridElements" :render-component="AppGridElement" :metadata="metadata"
                 :rows="gridData.rowCount" :columns="gridData.minColumnCount" :background-color="metadata.colorConfig.gridBackgroundColor">
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
</style>
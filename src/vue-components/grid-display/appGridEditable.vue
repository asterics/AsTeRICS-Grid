<template>
    <grid-layout class="grid-display" v-if="gridData" @moved="moveHandler" @resized="resizeHandler" v-on="$listeners"
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
    },
    computed: {
    },
    methods: {
        moveHandler(movedElement, diff) {
            if (diff.x === 0 && diff.y === 0) {
                return;
            }
            let id = movedElement.children[0].id;
            let element = this.getElement(id);
            this.gridData.gridElements = gridLayoutUtil.resolveCollisions(this.gridData.gridElements, element, {
                diff: diff,
                gridWidth: this.gridData.minColumnCount,
                gridHeight: this.gridData.rowCount,
                calcNewPos: true
            });
            this.$emit("changed", this.gridData);
        },
        resizeHandler(resizedElement, newSize) {
            let id = resizedElement.children[0].id;
            let element = this.getElement(id);
            if (!element || !newSize ||
                (newSize.width === resizedElement.width && newSize.height === resizedElement.height)) {
                return;
            }
            element.width = newSize.width;
            element.height = newSize.height;
            this.gridData.gridElements = gridLayoutUtil.resolveCollisions(this.gridData.gridElements, element, {
                gridWidth: this.gridData.minColumnCount,
                gridHeight: this.gridData.rowCount
            });
            this.$emit('changed', this.gridData);
        },
        getElement(id) {
            return this.gridData.gridElements.find(el => el.id === id);
        }
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